// ═══════════════════════════════════════════════════════════════════
// Basecamp 3 API — service layer
// Wraps every tracked endpoint with rate-limiting, pagination, and
// error handling. ES module — consumed by app.js.
// ═══════════════════════════════════════════════════════════════════

const CFG = window.BASECAMP_CONFIG || {};
const API_BASE = CFG.BASECAMP_API_BASE || 'https://3.basecampapi.com';

// ── Rate limiter ────────────────────────────────────────────────────
const rateState = { tokens: CFG.RATE_LIMIT_MAX || 50, last: Date.now() };

function waitForRate() {
  const now = Date.now();
  const elapsed = now - rateState.last;
  const window = CFG.RATE_LIMIT_WINDOW_MS || 10000;
  if (elapsed >= window) {
    rateState.tokens = CFG.RATE_LIMIT_MAX || 50;
    rateState.last = now;
  }
  if (rateState.tokens > 0) {
    rateState.tokens--;
    return Promise.resolve();
  }
  const delay = window - elapsed + 100;
  return new Promise(r => setTimeout(r, delay)).then(() => {
    rateState.tokens = (CFG.RATE_LIMIT_MAX || 50) - 1;
    rateState.last = Date.now();
  });
}

// ── Core fetch wrapper ──────────────────────────────────────────────
async function bcFetch(url, token, opts = {}) {
  await waitForRate();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Thmanyah Basecamp Analytics (admin@thmanyah.com)',
    ...opts.headers,
  };
  const res = await fetch(url, { ...opts, headers });
  if (res.status === 429) {
    const retry = parseInt(res.headers.get('Retry-After') || '10', 10);
    await new Promise(r => setTimeout(r, retry * 1000));
    return bcFetch(url, token, opts);
  }
  if (res.status === 304) return null;       // Not Modified (ETag)
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Basecamp API ${res.status}: ${body}`);
  }
  return res;
}

async function getJSON(url, token) {
  const res = await bcFetch(url, token);
  return res ? res.json() : null;
}

// ── Paginate: follows Link rel="next" until exhausted ───────────────
async function getAllPages(url, token, onPage) {
  let items = [];
  let next = url;
  while (next) {
    const res = await bcFetch(next, token);
    if (!res) break;
    const page = await res.json();
    items = items.concat(page);
    if (onPage) onPage(page, items.length);
    const link = res.headers.get('Link') || '';
    const match = link.match(/<([^>]+)>;\s*rel="next"/);
    next = match ? match[1] : null;
  }
  return items;
}

// ═══════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════

export class BasecampAPI {
  constructor(accountId, accessToken) {
    this.accountId = accountId;
    this.token = accessToken;
    this.base = `${API_BASE}/${accountId}`;
  }

  // ── Authorization ─────────────────────────────────────────────────
  // Verify token and get current account info.
  async getAuthorization() {
    const url = 'https://launchpad.37signals.com/authorization.json';
    return getJSON(url, this.token);
  }

  // ── People ────────────────────────────────────────────────────────
  async getPeople(onPage) {
    return getAllPages(`${this.base}/people.json`, this.token, onPage);
  }

  async getPerson(personId) {
    return getJSON(`${this.base}/people/${personId}.json`, this.token);
  }

  async getMyProfile() {
    return getJSON(`${this.base}/my/profile.json`, this.token);
  }

  async getProjectPeople(projectId) {
    return getAllPages(`${this.base}/projects/${projectId}/people.json`, this.token);
  }

  // ── Projects ──────────────────────────────────────────────────────
  async getProjects(onPage) {
    return getAllPages(`${this.base}/projects.json`, this.token, onPage);
  }

  async getProject(projectId) {
    return getJSON(`${this.base}/projects/${projectId}.json`, this.token);
  }

  async getArchivedProjects(onPage) {
    return getAllPages(`${this.base}/projects.json?status=archived`, this.token, onPage);
  }

  // ── Events (Activity on a recording) ──────────────────────────────
  async getRecordingEvents(recordingId, onPage) {
    return getAllPages(`${this.base}/recordings/${recordingId}/events.json`, this.token, onPage);
  }

  // ── Recordings (cross-project, by type) ───────────────────────────
  // type: Comment, Document, Message, Question::Answer, Schedule::Entry,
  //       Todo, Todolist, Upload, Vault, Kanban::Card
  async getRecordingsByType(type, opts = {}) {
    let url = `${this.base}/projects/recordings.json?type=${encodeURIComponent(type)}`;
    if (opts.sort) url += `&sort=${opts.sort}`;
    if (opts.direction) url += `&direction=${opts.direction}`;
    if (opts.bucket) url += `&bucket=${opts.bucket}`;
    if (opts.status) url += `&status=${opts.status}`;
    return getAllPages(url, this.token, opts.onPage);
  }

  // ── Messages ──────────────────────────────────────────────────────
  async getMessages(messageBoardId, onPage) {
    return getAllPages(`${this.base}/message_boards/${messageBoardId}/messages.json`, this.token, onPage);
  }

  async getMessage(messageId) {
    return getJSON(`${this.base}/messages/${messageId}.json`, this.token);
  }

  // ── To-do Sets / Lists / Todos ────────────────────────────────────
  async getTodoLists(todosetId, onPage) {
    return getAllPages(`${this.base}/todosets/${todosetId}/todolists.json`, this.token, onPage);
  }

  async getTodos(todolistId, onPage) {
    return getAllPages(`${this.base}/todolists/${todolistId}/todos.json`, this.token, onPage);
  }

  async getCompletedTodos(todolistId, onPage) {
    return getAllPages(`${this.base}/todolists/${todolistId}/todos.json?completed=true`, this.token, onPage);
  }

  async getTodo(todoId) {
    return getJSON(`${this.base}/todos/${todoId}.json`, this.token);
  }

  // ── Reports ───────────────────────────────────────────────────────
  async getTodosAssigned(onPage) {
    return getAllPages(`${this.base}/reports/todos/assigned.json`, this.token, onPage);
  }

  async getTodosForPerson(personId, onPage) {
    return getAllPages(`${this.base}/reports/todos/assigned/${personId}.json`, this.token, onPage);
  }

  async getOverdueTodos() {
    return getJSON(`${this.base}/reports/todos/overdue.json`, this.token);
  }

  async getUpcomingSchedule() {
    return getJSON(`${this.base}/reports/schedules/upcoming.json`, this.token);
  }

  // ── Comments ──────────────────────────────────────────────────────
  async getComments(recordingId, onPage) {
    return getAllPages(`${this.base}/recordings/${recordingId}/comments.json`, this.token, onPage);
  }

  // ── Campfires (Chat) ──────────────────────────────────────────────
  async getCampfires(onPage) {
    return getAllPages(`${this.base}/chats.json`, this.token, onPage);
  }

  async getCampfireLines(chatId, onPage) {
    return getAllPages(`${this.base}/chats/${chatId}/lines.json`, this.token, onPage);
  }

  // ── Documents ─────────────────────────────────────────────────────
  async getDocuments(vaultId, onPage) {
    return getAllPages(`${this.base}/vaults/${vaultId}/documents.json`, this.token, onPage);
  }

  // ── Uploads / Files ───────────────────────────────────────────────
  async getUploads(vaultId, onPage) {
    return getAllPages(`${this.base}/vaults/${vaultId}/uploads.json`, this.token, onPage);
  }

  // ── Schedule ──────────────────────────────────────────────────────
  async getScheduleEntries(scheduleId, onPage) {
    return getAllPages(`${this.base}/schedules/${scheduleId}/entries.json`, this.token, onPage);
  }

  // ── Questionnaires / Check-ins ────────────────────────────────────
  async getQuestionnaire(questionnaireId) {
    return getJSON(`${this.base}/questionnaires/${questionnaireId}.json`, this.token);
  }

  async getQuestions(questionnaireId, onPage) {
    return getAllPages(`${this.base}/questionnaires/${questionnaireId}/questions.json`, this.token, onPage);
  }

  async getQuestionAnswers(questionId, onPage) {
    return getAllPages(`${this.base}/questions/${questionId}/answers.json`, this.token, onPage);
  }

  async getAnswersByPerson(questionId, personId) {
    return getAllPages(
      `${this.base}/questions/${questionId}/answers/by/${personId}.json`,
      this.token
    );
  }

  // ── Forwards (Email) ──────────────────────────────────────────────
  async getForwards(inboxId, onPage) {
    return getAllPages(`${this.base}/inboxes/${inboxId}/inbox_forwards.json`, this.token, onPage);
  }

  // ── Boosts (Reactions) ────────────────────────────────────────────
  async getBoosts(recordingId) {
    return getAllPages(`${this.base}/recordings/${recordingId}/boosts.json`, this.token);
  }

  // ── Webhooks ──────────────────────────────────────────────────────
  async getWebhooks(projectId) {
    return getAllPages(`${this.base}/buckets/${projectId}/webhooks.json`, this.token);
  }

  async createWebhook(projectId, payloadUrl, types) {
    const res = await bcFetch(`${this.base}/buckets/${projectId}/webhooks.json`, this.token, {
      method: 'POST',
      body: JSON.stringify({ payload_url: payloadUrl, types }),
    });
    return res.json();
  }

  // ── My Assignments ────────────────────────────────────────────────
  async getMyAssignments() {
    return getAllPages(`${this.base}/my/assignments.json`, this.token);
  }

  // ── Subscriptions ─────────────────────────────────────────────────
  async getSubscription(recordingId) {
    return getJSON(`${this.base}/recordings/${recordingId}/subscription.json`, this.token);
  }

  // ── Message Types ─────────────────────────────────────────────────
  async getMessageTypes(projectId) {
    return getAllPages(`${this.base}/buckets/${projectId}/categories.json`, this.token);
  }
}
