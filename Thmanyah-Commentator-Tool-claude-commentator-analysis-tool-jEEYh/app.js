/* ═══════════════════════════════════════════════════════════════════
   Thmanyah Commentator Analysis Tool — Application Logic
   ═══════════════════════════════════════════════════════════════════ */

// ── Configuration ──
const CONFIG = {
  apiKey: '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',
  model: 'google/gemini-2.5-pro',
  apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
  maxFileSizeMB: 200,
  warnFileSizeMB: 50,
};

const FORMAT_MAP = {
  'audio/wav': 'wav', 'audio/wave': 'wav', 'audio/x-wav': 'wav',
  'audio/mp3': 'mp3', 'audio/mpeg': 'mp3',
  'audio/aac': 'aac', 'audio/ogg': 'ogg', 'audio/flac': 'flac',
  'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/m4a': 'm4a',
  'audio/aiff': 'aiff', 'audio/x-aiff': 'aiff',
};

const ACCEPTED_EXTENSIONS = ['wav','mp3','ogg','flac','m4a','aac','aiff','mp4','webm'];

const CATEGORY_ICONS = {
  'الأداء الصوتي': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
  'اللغة والأسلوب': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  'التحليل التكتيكي': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  'تغطية الأحداث': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  'التوازن العاطفي': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  'التفاعل مع المشاهد': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  'المعرفة الرياضية': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  'الإبداع والتميز': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
};

// ── State ──
let state = {
  currentView: 'upload',
  file: null,
  report: null,
  abortController: null,
  timerInterval: null,
  timerSeconds: 0,
};

// ── Helpers ──
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function formatNum(n) {
  return String(n);
}

function getScoreColor(score) {
  if (score >= 85) return '#00C17A';
  if (score >= 70) return '#FFBC0A';
  if (score >= 50) return '#FF9172';
  return '#F24935';
}

function getScoreRating(score) {
  if (score >= 90) return 'ممتاز';
  if (score >= 80) return 'جيد جدًا';
  if (score >= 70) return 'جيد';
  if (score >= 60) return 'مقبول';
  return 'يحتاج تحسين';
}

function getScoreClass(score) {
  if (score >= 85) return 'score-excellent';
  if (score >= 70) return 'score-good';
  if (score >= 50) return 'score-average';
  return 'score-below-avg';
}

function getScoreBgStyle(score) {
  const color = getScoreColor(score);
  return `background: ${color}12; color: ${color};`;
}

function getMomentBadgeClass(type) {
  if (type === 'excellent' || type === 'positive') return 'badge-green';
  if (type === 'note' || type === 'neutral') return 'badge-amber';
  return 'badge-red';
}

function getMomentLabel(type) {
  if (type === 'excellent' || type === 'positive') return 'تعليق مميز';
  if (type === 'note' || type === 'neutral') return 'ملاحظة';
  return 'يحتاج تحسين';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function getFileFormat(file) {
  if (FORMAT_MAP[file.type]) return FORMAT_MAP[file.type];
  const ext = file.name.split('.').pop().toLowerCase();
  if (ACCEPTED_EXTENSIONS.includes(ext)) return ext;
  return null;
}

// ── Dummy Report Data (for reports list, stats pages) ──
const DUMMY_REPORTS = [
  {
    id: 'demo-1',
    commentator: 'فهد العتيبي',
    role: 'معلق',
    teamA: 'الهلال', teamB: 'النصر', score: '3 - 2',
    competition: 'دوري روشن — الجولة 22',
    date: '2026-02-08', overallScore: 79, rating: 'جيد جدًا',
    channel: 'SSC HD',
    video_url: 'https://mimir.thmanyah.com/videos/hilal-nasr-j22',
    categories: [
      { name: 'الأداء الصوتي', score: 85 }, { name: 'اللغة والأسلوب', score: 82 },
      { name: 'التحليل التكتيكي', score: 71 }, { name: 'تغطية الأحداث', score: 88 },
      { name: 'التوازن العاطفي', score: 65 }, { name: 'التفاعل مع المشاهد', score: 83 },
      { name: 'المعرفة الرياضية', score: 77 }, { name: 'الإبداع والتميز', score: 80 },
    ],
    comments: 'أداء قوي في وصف الأهداف واللحظات الحاسمة. يحتاج تحسين في الحياد عند قرارات الحكم. التحليل التكتيكي يحتاج مزيد من العمق في قراءة التشكيلات.',
    isDummy: true,
  },
  {
    id: 'demo-2',
    commentator: 'عيسى الحربين',
    role: 'معلق',
    teamA: 'الاتحاد', teamB: 'الأهلي', score: '1 - 1',
    competition: 'دوري روشن — الجولة 20',
    date: '2026-01-25', overallScore: 82, rating: 'جيد جدًا',
    channel: 'SSC Sport 1',
    video_url: 'https://mimir.thmanyah.com/videos/ittihad-ahli-j20',
    categories: [
      { name: 'الأداء الصوتي', score: 88 }, { name: 'اللغة والأسلوب', score: 86 },
      { name: 'التحليل التكتيكي', score: 78 }, { name: 'تغطية الأحداث', score: 85 },
      { name: 'التوازن العاطفي', score: 80 }, { name: 'التفاعل مع المشاهد', score: 79 },
      { name: 'المعرفة الرياضية', score: 82 }, { name: 'الإبداع والتميز', score: 76 },
    ],
    comments: 'أداء صوتي متميز مع وضوح عالي في النطق. ثراء لغوي ملحوظ وتنوع في الأسلوب السردي. يمكن تعزيز الإبداع بمزيد من العبارات المميزة والمقارنات التاريخية.',
    isDummy: true,
  },
  {
    id: 'demo-3',
    commentator: 'فهد العتيبي',
    role: 'معلق',
    teamA: 'الشباب', teamB: 'الرائد', score: '2 - 0',
    competition: 'دوري روشن — الجولة 18',
    date: '2026-01-11', overallScore: 74, rating: 'جيد',
    channel: 'SSC HD',
    video_url: 'https://mimir.thmanyah.com/videos/shabab-raed-j18',
    categories: [
      { name: 'الأداء الصوتي', score: 80 }, { name: 'اللغة والأسلوب', score: 76 },
      { name: 'التحليل التكتيكي', score: 68 }, { name: 'تغطية الأحداث', score: 82 },
      { name: 'التوازن العاطفي', score: 72 }, { name: 'التفاعل مع المشاهد', score: 70 },
      { name: 'المعرفة الرياضية', score: 69 }, { name: 'الإبداع والتميز', score: 72 },
    ],
    comments: 'أداء مقبول مع تغطية جيدة للأحداث. يحتاج تطوير ملحوظ في التحليل التكتيكي وقراءة التشكيلات. الأسلوب السردي يحتاج تنويع أكثر.',
    isDummy: true,
  },
  {
    id: 'demo-4',
    commentator: 'سارة المالكي',
    role: 'مقدم',
    teamA: 'استوديو', teamB: 'دوري روشن', score: '—',
    competition: 'استوديو التحليل — الجولة 22',
    date: '2026-02-08', overallScore: 85, rating: 'جيد جدًا',
    channel: 'SSC HD',
    video_url: 'https://mimir.thmanyah.com/videos/studio-j22',
    categories: [
      { name: 'الأداء الصوتي', score: 90 }, { name: 'اللغة والأسلوب', score: 88 },
      { name: 'إدارة الحوار', score: 82 }, { name: 'تغطية المحاور', score: 86 },
      { name: 'التوازن والحياد', score: 84 }, { name: 'التفاعل مع الضيوف', score: 88 },
      { name: 'المعرفة الرياضية', score: 80 }, { name: 'الحضور والكاريزما', score: 82 },
    ],
    comments: 'حضور قوي ومهني أمام الكاميرا. إدارة ممتازة للحوارات والتنقل بين المحاور. تحتاج تعزيز المعرفة التكتيكية لطرح أسئلة أعمق على المحللين.',
    isDummy: true,
  },
  {
    id: 'demo-5',
    commentator: 'أحمد الشهري',
    role: 'مراسل',
    teamA: 'الهلال', teamB: 'النصر', score: '3 - 2',
    competition: 'دوري روشن — الجولة 22',
    date: '2026-02-08', overallScore: 77, rating: 'جيد',
    channel: 'SSC HD',
    video_url: 'https://mimir.thmanyah.com/videos/reporter-hilal-nasr-j22',
    categories: [
      { name: 'الأداء الصوتي', score: 82 }, { name: 'اللغة والأسلوب', score: 78 },
      { name: 'دقة المعلومات', score: 80 }, { name: 'سرعة النقل', score: 75 },
      { name: 'التواصل مع الاستوديو', score: 74 }, { name: 'التحضير والإعداد', score: 76 },
      { name: 'التعامل مع المواقف', score: 72 }, { name: 'الحضور الميداني', score: 79 },
    ],
    comments: 'تقرير ميداني جيد مع دقة في نقل الأحداث. يحتاج تحسين سرعة النقل والتفاعل مع الاستوديو. الحضور الميداني مقنع ومهني.',
    isDummy: true,
  },
  {
    id: 'demo-6',
    commentator: 'خالد الزهراني',
    role: 'محلل',
    teamA: 'الاتحاد', teamB: 'الأهلي', score: '1 - 1',
    competition: 'دوري روشن — الجولة 20',
    date: '2026-01-25', overallScore: 81, rating: 'جيد جدًا',
    channel: 'SSC Sport 1',
    video_url: 'https://mimir.thmanyah.com/videos/analyst-ittihad-ahli-j20',
    categories: [
      { name: 'الأداء الصوتي', score: 78 }, { name: 'اللغة والأسلوب', score: 80 },
      { name: 'عمق التحليل', score: 88 }, { name: 'قراءة التشكيلات', score: 85 },
      { name: 'الموضوعية', score: 82 }, { name: 'التفاعل مع المعلق', score: 79 },
      { name: 'استخدام البيانات', score: 84 }, { name: 'وضوح الشرح', score: 76 },
    ],
    comments: 'تحليل تكتيكي عميق ومبني على بيانات. قراءة دقيقة للتشكيلات والتغييرات. يحتاج تبسيط الشرح أكثر ليكون مفهوم لجمهور أوسع.',
    isDummy: true,
  },
];

const VIEW_CONFIG = {
  home:       { title: 'الرئيسية',            navIdx: 0, actions: false },
  upload:     { title: 'تحليل جديد',           navIdx: 1, actions: false },
  loading:    { title: 'جارٍ التحليل...',       navIdx: 1, actions: false },
  report:     { title: 'تقرير تحليل الأداء',    navIdx: 2, actions: true },
  reports:    { title: 'التقارير',              navIdx: 2, actions: false },
  statistics: { title: 'الإحصائيات',           navIdx: 3, actions: false },
  stars:      { title: 'النجوم',              navIdx: 4, actions: false },
  criteria:   { title: 'المعايير',             navIdx: 5, actions: false },
  settings:   { title: 'الإعدادات',            navIdx: 6, actions: false },
};

// ── View Management ──
function showView(viewName) {
  state.currentView = viewName;
  $$('.view').forEach(v => v.classList.remove('view-active'));
  const target = $(`.view-${viewName}`);
  if (target) target.classList.add('view-active');

  const cfg = VIEW_CONFIG[viewName] || VIEW_CONFIG.home;
  const pageTitle = $('#pageTitle');
  const topBarActions = $('#topBarActions');
  if (pageTitle) pageTitle.textContent = cfg.title;
  if (topBarActions) topBarActions.style.display = cfg.actions ? 'flex' : 'none';

  // Update nav items
  $$('.nav-item').forEach((item, i) => {
    item.classList.toggle('active', i === cfg.navIdx);
  });

  // Scroll content to top
  const scroll = target?.querySelector('.content-scroll');
  if (scroll) scroll.scrollTop = 0;

  // Lazy-init pages
  if (viewName === 'home') initHomePage();
  if (viewName === 'reports') initReportsPage();
  if (viewName === 'statistics') initStatisticsPage();
  if (viewName === 'stars') initStarsPage();
  if (viewName === 'criteria') initCriteriaPage();
  if (viewName === 'settings') initSettingsPage();
}

function navigateTo(viewName) {
  showView(viewName);
}

// ── File Upload ──
function initUpload() {
  const dropZone = $('#dropZone');
  const fileInput = $('#fileInput');
  const browseBtn = $('#browseBtn');

  if (!dropZone || !fileInput) return;

  browseBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  });
}

function validateFile(file) {
  const format = getFileFormat(file);
  if (!format) {
    return { valid: false, error: 'صيغة الملف غير مدعومة', detail: `الصيغ المدعومة: ${ACCEPTED_EXTENSIONS.join(', ')}` };
  }
  const maxBytes = CONFIG.maxFileSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: 'حجم الملف كبير جدًا', detail: `الحد الأقصى ${CONFIG.maxFileSizeMB} ميغابايت. حجم ملفك: ${formatFileSize(file.size)}` };
  }
  return { valid: true };
}

function handleFile(file) {
  const validation = validateFile(file);
  if (!validation.valid) {
    showError(validation.error, validation.detail);
    return;
  }

  state.file = file;

  // Update file info display
  const fileInfo = $('#fileInfo');
  if (fileInfo) {
    fileInfo.innerHTML = `
      <div class="file-info-card">
        <div class="file-info-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </div>
        <div class="file-info-details">
          <span class="file-info-name">${file.name}</span>
          <span class="file-info-size">${formatFileSize(file.size)}</span>
        </div>
        <button class="file-info-remove" onclick="removeFile()" aria-label="إزالة">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
    fileInfo.style.display = 'block';
  }

  // Show analyze button
  const analyzeBtn = $('#analyzeBtn');
  if (analyzeBtn) {
    analyzeBtn.style.display = 'flex';
    analyzeBtn.onclick = () => startAnalysis();
  }
}

function removeFile() {
  state.file = null;
  const fileInfo = $('#fileInfo');
  const analyzeBtn = $('#analyzeBtn');
  const fileInput = $('#fileInput');
  if (fileInfo) { fileInfo.innerHTML = ''; fileInfo.style.display = 'none'; }
  if (analyzeBtn) analyzeBtn.style.display = 'none';
  if (fileInput) fileInput.value = '';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

// ── Progress / Loading ──
function startTimer() {
  state.timerSeconds = 0;
  updateTimerDisplay();
  state.timerInterval = setInterval(() => {
    state.timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function updateTimerDisplay() {
  const el = $('#loadingTimer');
  if (!el) return;
  const mins = Math.floor(state.timerSeconds / 60);
  const secs = state.timerSeconds % 60;
  el.textContent = `${formatNum(mins)}:${formatNum(String(secs).padStart(2, '0'))}`;
}

function updateProgress(step, total, message) {
  const stepsContainer = $('#loadingSteps');
  if (!stepsContainer) return;

  const steps = stepsContainer.querySelectorAll('.loading-step');
  steps.forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i < step - 1) s.classList.add('done');
    else if (i === step - 1) s.classList.add('active');
  });

  const msgEl = $('#loadingMessage');
  if (msgEl) msgEl.textContent = message;

  const progressFill = $('#loadingProgressFill');
  if (progressFill) {
    progressFill.style.width = `${(step / total) * 100}%`;
  }
}

// ── Analysis Flow ──
async function startAnalysis() {
  if (!state.file) return;

  showView('loading');
  startTimer();

  try {
    // Step 1: Encode file
    updateProgress(1, 4, 'جارٍ تجهيز الملف الصوتي...');
    const base64Audio = await fileToBase64(state.file);
    const format = getFileFormat(state.file);

    // Step 2: Send to API
    updateProgress(2, 4, 'جارٍ الإرسال إلى الذكاء الاصطناعي...');
    await sleep(500);

    // Step 3: Analyze
    updateProgress(3, 4, 'جارٍ تحليل التعليق وتقييم الأداء...');
    const result = await callAPI(base64Audio, format);

    // Step 4: Build report
    updateProgress(4, 4, 'جارٍ إنشاء التقرير...');
    await sleep(400);

    state.report = result;
    stopTimer();
    populateReport(result);
    showView('report');
    animateReport();

  } catch (err) {
    stopTimer();
    if (err.name === 'AbortError') {
      showView('upload');
      return;
    }
    showView('upload');
    showError('فشل في التحليل', err.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
  }
}

function cancelAnalysis() {
  if (state.abortController) {
    state.abortController.abort();
    state.abortController = null;
  }
  stopTimer();
  showView('upload');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── API Call ──
async function callAPI(base64Audio, format) {
  state.abortController = new AbortController();

  const prompt = buildAnalysisPrompt();

  const payload = {
    model: CONFIG.model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'input_audio',
            input_audio: {
              data: base64Audio,
              format: format,
            },
          },
        ],
      },
    ],
  };

  let response;
  let lastError;

  // Retry up to 3 times for network errors
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'Thmanyah Commentator Analysis Tool',
        },
        body: JSON.stringify(payload),
        signal: state.abortController.signal,
      });
      break;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
      if (attempt < 2) await sleep(2000 * Math.pow(2, attempt));
    }
  }

  if (!response) {
    throw new Error(lastError?.message || 'فشل الاتصال بالخادم. تأكد من اتصال الإنترنت وحاول مرة أخرى.');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || '';

    if (response.status === 401) {
      throw new Error('مفتاح API غير صالح. يرجى التحقق من المفتاح.');
    } else if (response.status === 429) {
      throw new Error('تم تجاوز حد الطلبات. يرجى الانتظار قليلًا ثم المحاولة مرة أخرى.');
    } else if (response.status === 413) {
      throw new Error('الملف الصوتي كبير جدًا. يرجى ضغطه أو اقتصاصه ثم المحاولة مرة أخرى.');
    } else {
      throw new Error(errMsg || `خطأ من الخادم (${response.status}). يرجى المحاولة لاحقًا.`);
    }
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error('لم يتم استلام رد من النموذج. يرجى المحاولة مرة أخرى.');
  }

  const rawContent = data.choices[0].message.content;
  return parseApiResponse(rawContent);
}

function buildAnalysisPrompt() {
  return `أنت خبير متخصص في تقييم وتحليل أداء المعلقين الرياضيين في مباريات كرة القدم وفقًا لأعلى المعايير المهنية العالمية المعتمدة في التقييم الإعلامي الرياضي.

استمع بعناية شديدة إلى التسجيل الصوتي المرفق وقم بالمهام التالية:

1. حدد معلومات المباراة من سياق التعليق: اسما الفريقين، النتيجة، اسم البطولة والجولة، والتاريخ إن ذُكر.
2. حدد اسم المعلق والقناة الناقلة.
3. أنشئ نصًا كاملًا (تفريغ) للتعليق مع التوقيت الزمني الدقيق بالدقائق وتحديد هوية كل متحدث (معلق رئيسي، محلل، مراسل، إلخ).
4. قيّم الأداء عبر 8 محاور رئيسية، كل محور يحتوي على 4 معايير فرعية بدرجة من 0 إلى 100:

   المحور 1 — الأداء الصوتي: وضوح النطق والإلقاء، التنوع في طبقات الصوت، إيقاع وسرعة الكلام، إدارة فترات الصمت
   المحور 2 — اللغة والأسلوب: سلامة اللغة العربية، ثراء المفردات، البلاغة والتعبيرات، الأسلوب السردي
   المحور 3 — التحليل التكتيكي: قراءة التشكيلات والخطط، تفسير القرارات التكتيكية، دقة المعلومات والإحصائيات، الإعداد والتحضير المسبق
   المحور 4 — تغطية الأحداث: وصف اللعب لحظة بلحظة، تعليق الأهداف واللحظات الحاسمة، التزامن مع الصورة، تغطية الإعادات
   المحور 5 — التوازن العاطفي: الحياد وعدم الانحياز، التعامل مع قرارات الحكم، إدارة الانفعالات، الاحترافية في المواقف الصعبة
   المحور 6 — التفاعل مع المشاهد: بناء الإثارة والتشويق، إضافة قيمة معرفية، التواصل مع المحلل، الخاتمة والتلخيص
   المحور 7 — المعرفة الرياضية: معرفة تاريخ اللاعبين، الإلمام بسياق البطولة، المراجع التاريخية والمقارنات، معرفة القوانين واللوائح
   المحور 8 — الإبداع والتميز: أسلوب تعليق فريد، عبارات وتعبيرات لا تُنسى، القدرة على السرد القصصي، اتساق الهوية الشخصية

5. حدد أبرز اللحظات المحورية في التعليق مع التوقيت.
6. اذكر 3-5 نقاط قوة و2-4 مجالات تحتاج تحسين.
7. احسب الدرجة الكلية كمعدل مرجح لدرجات المحاور.
8. استخرج إحصائيات الأداء: عدد الكلمات التقريبي في الدقيقة، إجمالي الكلمات، نسبة الصمت، عدد المفردات الفريدة، نسبة التكرار، عدد الأخطاء المعلوماتية، عدد التفاعلات مع المحلل.
9. اقتبس 3-4 من أبرز العبارات المميزة التي قالها المعلق حرفيًا مع التوقيت.
10. قدّر مستوى الحماس التعليقي عبر المباراة كمصفوفة من 0-100 لكل 5 دقائق.

مهم جدًا: استخدم الأرقام الإنجليزية (0-9) وليس العربية. أعد جميع النتائج حصريًا بصيغة JSON صالحة (بدون أي نص قبلها أو بعدها، وبدون علامات markdown). استخدم الهيكل التالي بالضبط:

{
  "match_info": {"team_a": "...", "team_b": "...", "score": "X - X", "competition": "...", "date": "..."},
  "commentator": {"name": "...", "channel": "..."},
  "overall": {"score": 79, "rating": "جيد جدًا", "summary": "ملخص الأداء في 2-3 جمل"},
  "tags": ["وصف قصير 1", "وصف قصير 2", "وصف قصير 3"],
  "categories": [
    {"name": "الأداء الصوتي", "score": 85, "rating": "جيد جدًا", "criteria": [
      {"name": "وضوح النطق والإلقاء", "score": 88, "note": "ملاحظة تفصيلية"},
      {"name": "التنوع في طبقات الصوت", "score": 84, "note": "..."},
      {"name": "إيقاع وسرعة الكلام", "score": 82, "note": "..."},
      {"name": "إدارة فترات الصمت", "score": 80, "note": "..."}
    ]},
    {"name": "اللغة والأسلوب", "score": 82, "rating": "جيد جدًا", "criteria": [...]},
    {"name": "التحليل التكتيكي", "score": 71, "rating": "جيد", "criteria": [...]},
    {"name": "تغطية الأحداث", "score": 88, "rating": "ممتاز", "criteria": [...]},
    {"name": "التوازن العاطفي", "score": 65, "rating": "مقبول", "criteria": [...]},
    {"name": "التفاعل مع المشاهد", "score": 83, "rating": "جيد جدًا", "criteria": [...]},
    {"name": "المعرفة الرياضية", "score": 77, "rating": "جيد", "criteria": [...]},
    {"name": "الإبداع والتميز", "score": 80, "rating": "جيد جدًا", "criteria": [...]}
  ],
  "performance_stats": {
    "words_per_minute": 142,
    "total_words": 12847,
    "silence_percentage": 18,
    "unique_vocabulary": 1243,
    "repetition_rate": 7.2,
    "factual_errors": 2,
    "analyst_interactions": 14,
    "peak_excitement_count": 8
  },
  "notable_quotes": [
    {"time": "23'", "text": "اقتباس حرفي مميز من المعلق", "context": "سياق الاقتباس"},
    {"time": "67'", "text": "...", "context": "..."}
  ],
  "excitement_timeline": [60, 45, 70, 80, 55, 90, 40, 65, 75, 85, 95, 70, 80, 60, 50, 88, 92, 45],
  "key_moments": [
    {"time": "12'", "type": "excellent", "description": "وصف اللحظة"},
    {"time": "55'", "type": "note", "description": "..."},
    {"time": "78'", "type": "needs_improvement", "description": "..."}
  ],
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
  "improvements": ["مجال تحسين 1", "مجال تحسين 2"],
  "transcription": [
    {"time": "00:00", "speaker": "المعلق", "text": "نص الكلام"},
    {"time": "00:30", "speaker": "المحلل", "text": "نص الكلام"}
  ]
}`;
}

function parseApiResponse(rawContent) {
  let text = rawContent.trim();

  // Strip markdown code blocks if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  text = text.trim();

  // Try direct parse
  try {
    const parsed = JSON.parse(text);
    return validateReport(parsed);
  } catch (e) { /* continue */ }

  // Try extracting JSON object from text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return validateReport(parsed);
    } catch (e) { /* continue */ }
  }

  // Try fixing common issues: trailing commas
  try {
    const fixed = text.replace(/,\s*([}\]])/g, '$1');
    const parsed = JSON.parse(fixed);
    return validateReport(parsed);
  } catch (e) { /* continue */ }

  throw new Error('لم يتمكن النظام من تحليل استجابة النموذج. يرجى المحاولة مرة أخرى.\n\nالاستجابة الخام:\n' + text.substring(0, 500));
}

function validateReport(data) {
  // Ensure required fields exist with defaults
  const report = {
    match_info: {
      team_a: data.match_info?.team_a || 'غير محدد',
      team_b: data.match_info?.team_b || 'غير محدد',
      score: data.match_info?.score || 'غير محدد',
      competition: data.match_info?.competition || 'غير محدد',
      date: data.match_info?.date || 'غير محدد',
    },
    commentator: {
      name: data.commentator?.name || 'غير محدد',
      channel: data.commentator?.channel || 'غير محدد',
    },
    overall: {
      score: Math.min(100, Math.max(0, data.overall?.score ?? 50)),
      rating: data.overall?.rating || getScoreRating(data.overall?.score ?? 50),
      summary: data.overall?.summary || '',
    },
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 4) : [],
    categories: [],
    key_moments: [],
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    improvements: Array.isArray(data.improvements) ? data.improvements : [],
    transcription: Array.isArray(data.transcription) ? data.transcription : [],
    performance_stats: data.performance_stats || null,
    notable_quotes: Array.isArray(data.notable_quotes) ? data.notable_quotes : [],
    excitement_timeline: Array.isArray(data.excitement_timeline) ? data.excitement_timeline : [],
    video_url: data.video_url || '',
  };

  // Validate categories
  if (Array.isArray(data.categories)) {
    report.categories = data.categories.map(cat => ({
      name: cat.name || 'غير محدد',
      score: Math.min(100, Math.max(0, cat.score ?? 50)),
      rating: cat.rating || getScoreRating(cat.score ?? 50),
      criteria: Array.isArray(cat.criteria) ? cat.criteria.map(cr => ({
        name: cr.name || '',
        score: Math.min(100, Math.max(0, cr.score ?? 50)),
        note: cr.note || '',
      })) : [],
    }));
  }

  // Validate key moments
  if (Array.isArray(data.key_moments)) {
    report.key_moments = data.key_moments.map(m => ({
      time: m.time || '',
      type: m.type || 'note',
      description: m.description || '',
    }));
  }

  return report;
}

// ── Report Population ──
function populateReport(data) {
  populateMatchBanner(data);
  populateVideoLink(data);
  populateOverallScore(data);
  populateCategoryCards(data);
  populatePerformanceStats(data);
  populateDetailedBreakdown(data);
  populateRadarChart(data);
  populateExcitementTimeline(data);
  populateNotableQuotes(data);
  populateTranscription(data);
  populateKeyMoments(data);
  populateStrengthsAndImprovements(data);
}

function populateVideoLink(data) {
  const section = document.getElementById('rVideoSection');
  const urlEl = document.getElementById('rVideoUrl');
  const btnEl = document.getElementById('rVideoBtn');
  if (!section) return;

  const url = data.video_url || '';
  if (!url) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  if (urlEl) { urlEl.textContent = url; urlEl.href = url; }
  if (btnEl) { btnEl.href = url; }
}

function populateMatchBanner(data) {
  const mi = data.match_info;
  const c = data.commentator;

  const el = (id) => document.getElementById(id);
  const setText = (id, text) => { const e = el(id); if (e) e.textContent = text; };

  setText('rTeamAName', mi.team_a);
  setText('rTeamBName', mi.team_b);
  setText('rMatchScore', mi.score);
  setText('rMatchLabel', mi.competition);
  setText('rMatchDate', mi.date);
  setText('rCommentatorName', c.name);
  setText('rCommentatorChannel', c.channel);

  // Team badge initials
  const badgeA = el('rTeamABadge');
  const badgeB = el('rTeamBBadge');
  if (badgeA) badgeA.textContent = mi.team_a.substring(0, 2);
  if (badgeB) badgeB.textContent = mi.team_b.substring(0, 2);

  // Commentator avatar
  const avatar = el('rCommentatorAvatar');
  if (avatar) avatar.textContent = c.name.charAt(0) || '؟';
}

function populateOverallScore(data) {
  const o = data.overall;
  const scoreNum = document.getElementById('rOverallScore');
  const summaryEl = document.getElementById('rOverallSummary');
  const tagsContainer = document.getElementById('rOverallTags');

  if (scoreNum) scoreNum.textContent = formatNum(o.score);
  if (summaryEl) {
    const ratingHtml = `<span class="highlight highlight-green">${o.rating}</span>`;
    summaryEl.innerHTML = `أداء ${ratingHtml} — ${o.summary}`;
  }

  if (tagsContainer && data.tags.length > 0) {
    const tagColors = ['tag-green', 'tag-amber', 'tag-blue', 'tag-green'];
    tagsContainer.innerHTML = data.tags.map((t, i) =>
      `<span class="tag ${tagColors[i % tagColors.length]}">${t}</span>`
    ).join('');
  }

  // Update ring color
  const ringFill = $('.score-ring-fill');
  if (ringFill) ringFill.setAttribute('stroke', getScoreColor(o.score));
}

function populateCategoryCards(data) {
  const container = document.getElementById('rCategoryCards');
  if (!container) return;
  container.innerHTML = '';

  data.categories.forEach(cat => {
    const color = getScoreColor(cat.score);
    const icon = CATEGORY_ICONS[cat.name] || CATEGORY_ICONS['الأداء الصوتي'];

    const card = document.createElement('div');
    card.className = 'card score-card';
    card.innerHTML = `
      <div class="score-card-header">
        <div class="score-card-icon" style="background: ${color}12; color: ${color};">
          ${icon}
        </div>
        <div class="score-card-value">
          <span class="score-card-number">${formatNum(cat.score)}</span>
          <span class="score-card-rating">${cat.rating}</span>
        </div>
      </div>
      <h3 class="score-card-title">${cat.name}</h3>
      <p class="score-card-desc">${cat.criteria.map(c => c.name).slice(0, 2).join('، ')}</p>
      <div class="mini-bar"><div class="mini-bar-fill" style="width:${cat.score}%; background:${color};"></div></div>
    `;
    container.appendChild(card);
  });
}

function populateDetailedBreakdown(data) {
  const container = document.getElementById('rCriteriaList');
  if (!container) return;
  container.innerHTML = '';

  data.categories.forEach(cat => {
    const dotColor = getScoreColor(cat.score);

    let groupHtml = `
      <div class="criteria-group">
        <h3 class="criteria-group-title">
          <span class="criteria-dot" style="background:${dotColor}"></span>
          ${cat.name}
        </h3>
    `;

    cat.criteria.forEach(cr => {
      const crColor = getScoreColor(cr.score);
      const crClass = getScoreClass(cr.score);
      groupHtml += `
        <div class="criteria-item">
          <div class="criteria-info">
            <span class="criteria-name">${cr.name}</span>
            <span class="criteria-score ${crClass}">${formatNum(cr.score)}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${cr.score}%; background:${crColor};"></div></div>
          <p class="criteria-note">${cr.note}</p>
        </div>
      `;
    });

    groupHtml += '</div>';
    container.insertAdjacentHTML('beforeend', groupHtml);
  });
}

function populateTranscription(data) {
  const section = document.getElementById('rTranscriptionSection');
  const container = document.getElementById('rTranscriptionList');
  if (!section || !container) return;

  if (!data.transcription || data.transcription.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  container.innerHTML = '';

  const speakerColors = {};
  const colors = ['#00C17A', '#0072F9', '#FFBC0A', '#F24935', '#82003A'];
  let colorIdx = 0;

  data.transcription.forEach(entry => {
    if (!speakerColors[entry.speaker]) {
      speakerColors[entry.speaker] = colors[colorIdx % colors.length];
      colorIdx++;
    }
    const color = speakerColors[entry.speaker];

    const row = document.createElement('div');
    row.className = 'transcript-entry';
    row.innerHTML = `
      <span class="transcript-time">${entry.time}</span>
      <span class="transcript-speaker" style="background:${color}15; color:${color}; border: 1px solid ${color}30;">${entry.speaker}</span>
      <span class="transcript-text">${entry.text}</span>
    `;
    container.appendChild(row);
  });
}

function populateKeyMoments(data) {
  const container = document.getElementById('rMomentsList');
  if (!container) return;
  container.innerHTML = '';

  data.key_moments.forEach(m => {
    const badgeClass = getMomentBadgeClass(m.type);
    const label = m.label || getMomentLabel(m.type);

    const el = document.createElement('div');
    el.className = 'moment';
    el.innerHTML = `
      <div class="moment-time">${m.time}</div>
      <div class="moment-content">
        <div class="moment-badge ${badgeClass}">${label}</div>
        <p class="moment-text">${m.description}</p>
      </div>
    `;
    container.appendChild(el);
  });

  // Re-add the timeline lines (all but last)
  const moments = container.querySelectorAll('.moment');
  moments.forEach((m, i) => {
    if (i < moments.length - 1) m.classList.add('has-line');
  });
}

function populateStrengthsAndImprovements(data) {
  const strengthsList = document.getElementById('rStrengthsList');
  const improvementsList = document.getElementById('rImprovementsList');

  if (strengthsList) {
    strengthsList.innerHTML = data.strengths.map(s =>
      `<li><span class="strength-icon">&#10003;</span><span>${s}</span></li>`
    ).join('');
  }

  if (improvementsList) {
    improvementsList.innerHTML = data.improvements.map(s =>
      `<li><span class="improvement-icon">!</span><span>${s}</span></li>`
    ).join('');
  }
}

// ── New Sections: Stats, Radar, Excitement, Quotes ──
function populatePerformanceStats(data) {
  const container = document.getElementById('rPerformanceStats');
  if (!container || !data.performance_stats) { if (container) container.closest('.stats-section')?.remove(); return; }
  const s = data.performance_stats;
  const stats = [
    { label: 'كلمة / دقيقة', value: s.words_per_minute || '—', icon: 'speed' },
    { label: 'إجمالي الكلمات', value: s.total_words ? s.total_words.toLocaleString() : '—', icon: 'words' },
    { label: 'نسبة الصمت', value: s.silence_percentage != null ? s.silence_percentage + '%' : '—', icon: 'silence' },
    { label: 'مفردات فريدة', value: s.unique_vocabulary ? s.unique_vocabulary.toLocaleString() : '—', icon: 'vocab' },
    { label: 'نسبة التكرار', value: s.repetition_rate != null ? s.repetition_rate + '%' : '—', icon: 'repeat' },
    { label: 'أخطاء معلوماتية', value: s.factual_errors ?? '—', icon: 'errors' },
    { label: 'تفاعلات مع المحلل', value: s.analyst_interactions ?? '—', icon: 'interact' },
    { label: 'لحظات ذروة الحماس', value: s.peak_excitement_count ?? '—', icon: 'peak' },
  ];
  container.innerHTML = stats.map(st => `
    <div class="stat-card">
      <span class="stat-value" data-count="${parseFloat(String(st.value).replace(/[^0-9.]/g,'')) || 0}">${st.value}</span>
      <span class="stat-label">${st.label}</span>
    </div>
  `).join('');
}

function populateRadarChart(data) {
  const container = document.getElementById('rRadarChart');
  if (!container || !data.categories || data.categories.length < 6) return;
  const cats = data.categories;
  const n = cats.length;
  const cx = 150, cy = 150, maxR = 120;
  const angleStep = (2 * Math.PI) / n;

  // Build grid
  let gridSvg = '';
  [0.25, 0.5, 0.75, 1].forEach(scale => {
    let pts = [];
    for (let i = 0; i < n; i++) {
      const a = angleStep * i - Math.PI / 2;
      pts.push(`${cx + maxR * scale * Math.cos(a)},${cy + maxR * scale * Math.sin(a)}`);
    }
    gridSvg += `<polygon points="${pts.join(' ')}" fill="none" stroke="#EFEDE2" stroke-width="1"/>`;
  });
  // Axes
  for (let i = 0; i < n; i++) {
    const a = angleStep * i - Math.PI / 2;
    gridSvg += `<line x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(a)}" y2="${cy + maxR * Math.sin(a)}" stroke="#EFEDE2" stroke-width="1"/>`;
  }
  // Data polygon
  let dataPts = [];
  for (let i = 0; i < n; i++) {
    const a = angleStep * i - Math.PI / 2;
    const r = maxR * (cats[i].score / 100);
    dataPts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  const dataPolygon = `<polygon points="${dataPts.join(' ')}" fill="rgba(0,193,122,0.15)" stroke="#00C17A" stroke-width="2.5" class="radar-polygon"/>`;
  // Dots + labels
  let dotsSvg = '';
  for (let i = 0; i < n; i++) {
    const a = angleStep * i - Math.PI / 2;
    const r = maxR * (cats[i].score / 100);
    dotsSvg += `<circle cx="${cx + r * Math.cos(a)}" cy="${cy + r * Math.sin(a)}" r="4" fill="#00C17A"/>`;
    const lr = maxR + 22;
    const lx = cx + lr * Math.cos(a);
    const ly = cy + lr * Math.sin(a);
    dotsSvg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="#333">${cats[i].name.split(' ')[0]}</text>`;
    dotsSvg += `<text x="${lx}" y="${ly + 14}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-weight="600" fill="#00C17A">${cats[i].score}</text>`;
  }
  container.innerHTML = `<svg viewBox="0 0 300 300" class="radar-svg">${gridSvg}${dataPolygon}${dotsSvg}</svg>`;
}

function populateExcitementTimeline(data) {
  const container = document.getElementById('rExcitementBars');
  if (!container || !data.excitement_timeline || data.excitement_timeline.length === 0) {
    const section = document.getElementById('rExcitementSection');
    if (section) section.remove();
    return;
  }
  container.innerHTML = data.excitement_timeline.map((v, i) => {
    const color = v >= 85 ? '#00C17A' : v >= 70 ? '#FFBC0A' : v >= 50 ? '#FF9172' : '#F24935';
    const minutes = i * 5;
    return `<div class="excitement-bar" style="height:${v}%; background:${color};" title="${minutes}' — ${v}%"><span class="excitement-label">${minutes}'</span></div>`;
  }).join('');
}

function populateNotableQuotes(data) {
  const container = document.getElementById('rNotableQuotes');
  if (!container || !data.notable_quotes || data.notable_quotes.length === 0) {
    const section = document.getElementById('rQuotesSection');
    if (section) section.remove();
    return;
  }
  container.innerHTML = data.notable_quotes.map(q => `
    <div class="quote-card">
      <div class="quote-mark">"</div>
      <p class="quote-text">${q.text}</p>
      <div class="quote-meta">
        <span class="quote-time">${q.time}</span>
        <span class="quote-context">${q.context || ''}</span>
      </div>
    </div>
  `).join('');
}

// ── Animations ──
function animateReport() {
  // Animate score ring
  const ring = document.querySelector('.view-report .score-ring-fill');
  if (ring && state.report) {
    const total = 2 * Math.PI * 70;
    const score = state.report.overall.score;
    const target = total - (total * score / 100);

    ring.setAttribute('stroke-dashoffset', String(total));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ring.style.transition = 'stroke-dashoffset 1.5s ease-out';
        ring.style.strokeDashoffset = target;
      });
    });
  }

  // Animate progress bars
  document.querySelectorAll('.view-report .progress-fill, .view-report .mini-bar-fill').forEach(bar => {
    const w = bar.style.width;
    bar.style.width = '0%';
    bar.style.transition = 'width 1s ease-out';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { bar.style.width = w; });
    });
  });

  // Staggered card animations
  document.querySelectorAll('.view-report .score-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(16px)';
    card.style.transition = `opacity 0.5s ease-out ${0.15 + i * 0.05}s, transform 0.5s ease-out ${0.15 + i * 0.05}s`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      });
    });
  });
}

// ── PDF Export ──
async function exportPDF() {
  const exportBtn = document.getElementById('exportPdfBtn');
  if (exportBtn) {
    exportBtn.disabled = true;
    exportBtn.innerHTML = `
      <svg class="btn-icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
      <span>جارٍ التصدير...</span>
    `;
  }

  try {
    const reportEl = document.querySelector('.view-report .report-content');
    if (!reportEl) throw new Error('لا يوجد تقرير لتصديره');

    // Dynamically load html2pdf.js if not already loaded
    if (!window.html2pdf) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js');
    }

    const commentatorName = state.report?.commentator?.name || 'تقرير';
    const filename = `تحليل-${commentatorName}-${new Date().toISOString().slice(0,10)}.pdf`;

    // Add print mode class for PDF-specific styling
    reportEl.classList.add('pdf-mode');

    await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        windowWidth: 900,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }).from(reportEl).save();

    reportEl.classList.remove('pdf-mode');

  } catch (err) {
    showError('فشل تصدير PDF', err.message);
  } finally {
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>تصدير PDF</span>
      `;
    }
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('فشل تحميل مكتبة التصدير'));
    document.head.appendChild(script);
  });
}

// ── Error Handling ──
function showError(title, message) {
  const modal = document.getElementById('errorModal');
  const titleEl = document.getElementById('errorTitle');
  const msgEl = document.getElementById('errorMessage');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  if (modal) modal.classList.add('visible');
}

function hideError() {
  const modal = document.getElementById('errorModal');
  if (modal) modal.classList.remove('visible');
}

// ── Transcription Toggle ──
function toggleTranscription() {
  const content = document.getElementById('rTranscriptionContent');
  const btn = document.getElementById('transcriptionToggle');
  if (!content) return;

  const isOpen = content.classList.toggle('expanded');
  if (btn) btn.textContent = isOpen ? 'إخفاء' : 'عرض الكل';
}

// ── New Analysis ──
function startNewAnalysis() {
  state.report = null;
  state.file = null;
  removeFile();
  showView('upload');
}

// ── Tab Filtering ──
function filterCriteria(filter) {
  const groups = document.querySelectorAll('#rCriteriaList .criteria-group');
  groups.forEach(group => {
    const items = group.querySelectorAll('.criteria-item');
    let visibleCount = 0;

    items.forEach(item => {
      const scoreEl = item.querySelector('.criteria-score');
      const score = parseInt(scoreEl?.textContent.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))) || 0;

      if (filter === 'all') {
        item.style.display = '';
        visibleCount++;
      } else if (filter === 'strengths' && score >= 85) {
        item.style.display = '';
        visibleCount++;
      } else if (filter === 'improvements' && score < 75) {
        item.style.display = '';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    group.style.display = visibleCount > 0 ? '' : 'none';
  });
}

// ═══════════════════════════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════════════════════════
let homeInitialized = false;
function initHomePage() {
  if (homeInitialized) return;
  homeInitialized = true;

  const container = document.getElementById('dashRecentReports');
  if (!container) return;

  container.innerHTML = DUMMY_REPORTS.slice(0, 3).map(r => `
    <div class="dash-report-card" onclick="${r.isDummy ? `window.open('dummy.html','_blank')` : ''}">
      <div class="dash-report-teams">
        <span class="dash-report-team">${r.teamA}</span>
        <span class="dash-report-vs">${r.score}</span>
        <span class="dash-report-team">${r.teamB}</span>
      </div>
      <div class="dash-report-meta">
        <span class="dash-report-commentator">${r.commentator}</span>
        <span class="dash-report-date">${r.date}</span>
      </div>
      <div class="dash-report-score-row">
        <div class="dash-report-score" style="background:${getScoreColor(r.overallScore)}15;color:${getScoreColor(r.overallScore)};">
          ${r.overallScore}
        </div>
        <span class="dash-report-rating">${r.rating}</span>
        <span class="dash-report-comp">${r.competition}</span>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════
// REPORTS LIST PAGE
// ═══════════════════════════════════════════════════════════════
let reportsInitialized = false;
function initReportsPage() {
  if (reportsInitialized) return;
  reportsInitialized = true;
  renderReportsGrid();

  // All filters trigger re-render
  const filterIds = ['reportsSearchInput', 'reportsRoleFilter', 'reportsScoreFilter', 'reportsDateFilter', 'reportsSortSelect'];
  filterIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', () => renderReportsGrid());
    }
  });
}

function getFilteredReports() {
  let reports = [...DUMMY_REPORTS];

  // Text search
  const search = document.getElementById('reportsSearchInput')?.value.trim();
  if (search) {
    const q = search.toLowerCase();
    reports = reports.filter(r =>
      r.commentator.includes(q) || r.teamA.includes(q) || r.teamB.includes(q) || r.channel.includes(q)
    );
  }

  // Role filter
  const roleFilter = document.getElementById('reportsRoleFilter')?.value;
  if (roleFilter && roleFilter !== 'all') {
    reports = reports.filter(r => r.role === roleFilter);
  }

  // Score filter
  const scoreFilter = document.getElementById('reportsScoreFilter')?.value;
  if (scoreFilter && scoreFilter !== 'all') {
    const [min, max] = scoreFilter.split('-').map(Number);
    reports = reports.filter(r => r.overallScore >= min && r.overallScore <= max);
  }

  // Date filter
  const dateFilter = document.getElementById('reportsDateFilter')?.value;
  if (dateFilter && dateFilter !== 'all') {
    const days = parseInt(dateFilter);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    reports = reports.filter(r => new Date(r.date) >= cutoff);
  }

  // Sort
  const sort = document.getElementById('reportsSortSelect')?.value || 'date-desc';
  reports.sort((a, b) => {
    if (sort === 'date-desc') return b.date.localeCompare(a.date);
    if (sort === 'date-asc') return a.date.localeCompare(b.date);
    if (sort === 'score-desc') return b.overallScore - a.overallScore;
    if (sort === 'score-asc') return a.overallScore - b.overallScore;
    return 0;
  });

  return reports;
}

function renderReportsGrid() {
  const grid = document.getElementById('reportsGrid');
  if (!grid) return;

  let reports = getFilteredReports();

  if (reports.length === 0) {
    grid.innerHTML = `<div class="reports-empty"><p>لا توجد تقارير مطابقة للبحث</p></div>`;
    return;
  }

  grid.innerHTML = reports.map(r => {
    const topCat = [...r.categories].sort((a, b) => b.score - a.score)[0];
    const lowCat = [...r.categories].sort((a, b) => a.score - b.score)[0];
    return `
    <div class="report-list-card" onclick="${r.isDummy ? `window.open('dummy.html','_blank')` : ''}">
      <div class="report-list-top">
        <div class="report-list-match">
          <span class="report-list-teams">${r.teamA} ${r.score} ${r.teamB}</span>
          <span class="report-list-comp">${r.competition}</span>
        </div>
        <div class="report-list-overall" style="background:${getScoreColor(r.overallScore)}12;color:${getScoreColor(r.overallScore)};border:2px solid ${getScoreColor(r.overallScore)}30;">
          <span class="report-list-overall-num">${r.overallScore}</span>
          <span class="report-list-overall-max">/100</span>
        </div>
      </div>
      <div class="report-list-info">
        <div class="report-list-commentator">
          <div class="report-list-avatar">${r.commentator.charAt(0)}</div>
          <div>
            <span class="report-list-name">${r.commentator}</span>
            <span class="report-list-channel">${r.channel} — ${r.date}</span>
          </div>
        </div>
      </div>
      <div class="report-list-cats">
        ${r.categories.map(c => `
          <div class="report-list-cat-bar">
            <span class="report-list-cat-name">${c.name.split(' ')[0]}</span>
            <div class="report-list-cat-track"><div class="report-list-cat-fill" style="width:${c.score}%;background:${getScoreColor(c.score)};"></div></div>
            <span class="report-list-cat-score">${c.score}</span>
          </div>
        `).join('')}
      </div>
      <div class="report-list-footer">
        <span class="tag tag-blue">${r.role || 'معلق'}</span>
        <span class="report-list-best tag tag-green">الأفضل: ${topCat.name} (${topCat.score})</span>
        <span class="report-list-worst tag tag-amber">يحتاج تحسين: ${lowCat.name} (${lowCat.score})</span>
        ${r.video_url ? `<a href="${r.video_url}" target="_blank" rel="noopener" class="tag tag-blue" onclick="event.stopPropagation();" style="text-decoration:none;">&#9654; مشاهدة الفيديو</a>` : ''}
      </div>
    </div>
  `;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// STATISTICS PAGE
// ═══════════════════════════════════════════════════════════════
let statsInitialized = false;
function initStatisticsPage() {
  if (statsInitialized) return;
  statsInitialized = true;

  renderStatsCategoryBars();
  renderStatsComparison();
  renderStatsDistribution();
  renderStatsStrengthsImprovements();
  renderStatsTrendChart();
  renderStatsFacts();
  animateStatsCounters();
}

function renderStatsCategoryBars() {
  const container = document.getElementById('statsCategoryBars');
  if (!container) return;

  const catNames = DUMMY_REPORTS[0].categories.map(c => c.name);
  const avgScores = catNames.map((name, i) => {
    const sum = DUMMY_REPORTS.reduce((s, r) => s + r.categories[i].score, 0);
    return { name, score: Math.round(sum / DUMMY_REPORTS.length) };
  });

  container.innerHTML = avgScores.map(c => `
    <div class="stats-bar-row">
      <span class="stats-bar-label">${c.name}</span>
      <div class="stats-bar-track">
        <div class="stats-bar-fill" style="width:${c.score}%;background:${getScoreColor(c.score)};"></div>
      </div>
      <span class="stats-bar-value" style="color:${getScoreColor(c.score)}">${c.score}</span>
    </div>
  `).join('');
}

function renderStatsComparison() {
  const container = document.getElementById('statsComparison');
  if (!container) return;

  const commentators = {};
  DUMMY_REPORTS.forEach(r => {
    if (!commentators[r.commentator]) commentators[r.commentator] = { reports: [], name: r.commentator };
    commentators[r.commentator].reports.push(r);
  });

  const colors = ['#00C17A', '#0072F9', '#FFBC0A', '#F24935'];
  const entries = Object.values(commentators);

  container.innerHTML = `
    <div class="stats-comparison-legend">
      ${entries.map((e, i) => `<span class="stats-legend-item"><span class="stats-legend-dot" style="background:${colors[i]}"></span>${e.name} (${e.reports.length} تقارير)</span>`).join('')}
    </div>
    <div class="stats-comparison-bars">
      ${DUMMY_REPORTS[0].categories.map((cat, ci) => `
        <div class="stats-comp-row">
          <span class="stats-comp-label">${cat.name.split(' ')[0]}</span>
          <div class="stats-comp-bars-group">
            ${entries.map((e, ei) => {
              const avg = Math.round(e.reports.reduce((s, r) => s + r.categories[ci].score, 0) / e.reports.length);
              return `<div class="stats-comp-bar" style="width:${avg}%;background:${colors[ei]};" title="${e.name}: ${avg}"><span class="stats-comp-bar-val">${avg}</span></div>`;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderStatsDistribution() {
  const container = document.getElementById('statsDistribution');
  if (!container) return;

  // Collect all criteria scores
  const allScores = [];
  DUMMY_REPORTS.forEach(r => r.categories.forEach(c => {
    allScores.push(c.score);
  }));

  const buckets = [
    { label: 'ممتاز (90-100)', min: 90, max: 100, color: '#00C17A' },
    { label: 'جيد جدًا (80-89)', min: 80, max: 89, color: '#B2E2BA' },
    { label: 'جيد (70-79)', min: 70, max: 79, color: '#FFBC0A' },
    { label: 'مقبول (60-69)', min: 60, max: 69, color: '#FF9172' },
    { label: 'يحتاج تحسين (<60)', min: 0, max: 59, color: '#F24935' },
  ];

  const maxCount = Math.max(...buckets.map(b => allScores.filter(s => s >= b.min && s <= b.max).length));

  container.innerHTML = `
    <div class="stats-dist-bars">
      ${buckets.map(b => {
        const count = allScores.filter(s => s >= b.min && s <= b.max).length;
        const pct = maxCount > 0 ? (count / maxCount * 100) : 0;
        return `
          <div class="stats-dist-item">
            <div class="stats-dist-bar-wrap">
              <div class="stats-dist-bar" style="height:${pct}%;background:${b.color};"></div>
            </div>
            <span class="stats-dist-count">${count}</span>
            <span class="stats-dist-label">${b.label.split(' ')[0]}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderStatsStrengthsImprovements() {
  const strengths = document.getElementById('statsTopStrengths');
  const improvements = document.getElementById('statsTopImprovements');

  const strongItems = [
    { text: 'تغطية الأحداث لحظة بلحظة', count: 3, pct: 100 },
    { text: 'وضوح النطق والإلقاء', count: 3, pct: 100 },
    { text: 'بناء الإثارة والتشويق', count: 2, pct: 67 },
    { text: 'تعليق الأهداف واللحظات الحاسمة', count: 2, pct: 67 },
    { text: 'الإلمام بسياق البطولة', count: 2, pct: 67 },
  ];

  const weakItems = [
    { text: 'الحياد وعدم الانحياز', count: 2, pct: 67 },
    { text: 'تفسير القرارات التكتيكية', count: 3, pct: 100 },
    { text: 'الإعداد والتحضير المسبق', count: 2, pct: 67 },
    { text: 'المراجع التاريخية والمقارنات', count: 2, pct: 67 },
  ];

  if (strengths) {
    strengths.innerHTML = strongItems.map(s => `
      <div class="stats-list-item">
        <span class="stats-list-icon strength-icon">&#10003;</span>
        <div class="stats-list-content">
          <span class="stats-list-text">${s.text}</span>
          <span class="stats-list-meta">ظهرت في ${s.count} من ${DUMMY_REPORTS.length} تقارير (${s.pct}%)</span>
        </div>
      </div>
    `).join('');
  }

  if (improvements) {
    improvements.innerHTML = weakItems.map(s => `
      <div class="stats-list-item">
        <span class="stats-list-icon improvement-icon">!</span>
        <div class="stats-list-content">
          <span class="stats-list-text">${s.text}</span>
          <span class="stats-list-meta">ظهرت في ${s.count} من ${DUMMY_REPORTS.length} تقارير (${s.pct}%)</span>
        </div>
      </div>
    `).join('');
  }
}

function renderStatsTrendChart() {
  const container = document.getElementById('statsTrendChart');
  if (!container) return;

  const sorted = [...DUMMY_REPORTS].sort((a, b) => a.date.localeCompare(b.date));
  const points = sorted.map((r, i) => ({
    x: (i / Math.max(sorted.length - 1, 1)) * 100,
    y: 100 - r.overallScore,
    label: `${r.teamA} vs ${r.teamB}`,
    score: r.overallScore,
    date: r.date,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  container.innerHTML = `
    <div class="stats-trend-wrap">
      <svg viewBox="-5 0 110 110" class="stats-trend-svg" preserveAspectRatio="none">
        <!-- Grid lines -->
        <line x1="0" y1="0" x2="100" y2="0" stroke="#EFEDE2" stroke-width="0.5"/>
        <line x1="0" y1="25" x2="100" y2="25" stroke="#EFEDE2" stroke-width="0.5"/>
        <line x1="0" y1="50" x2="100" y2="50" stroke="#EFEDE2" stroke-width="0.5"/>
        <line x1="0" y1="75" x2="100" y2="75" stroke="#EFEDE2" stroke-width="0.5"/>
        <!-- Area -->
        <path d="${pathD} L ${points[points.length-1].x} 100 L ${points[0].x} 100 Z" fill="rgba(0,193,122,0.08)" />
        <!-- Line -->
        <path d="${pathD}" fill="none" stroke="#00C17A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Dots -->
        ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#00C17A" stroke="#fff" stroke-width="2"/>`).join('')}
      </svg>
      <div class="stats-trend-labels">
        ${points.map(p => `
          <div class="stats-trend-point" style="left:${p.x}%">
            <span class="stats-trend-score">${p.score}</span>
            <span class="stats-trend-match">${p.label}</span>
            <span class="stats-trend-date">${p.date}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderStatsFacts() {
  const container = document.getElementById('statsFacts');
  if (!container) return;

  const facts = [
    { icon: '🎙️', text: 'أعلى تقييم فردي: تغطية الأحداث لفهد العتيبي (88) في مباراة الهلال والنصر' },
    { icon: '📊', text: 'المحور الأكثر تفاوتًا: التوازن العاطفي — فارق 15 نقطة بين أعلى وأقل تقييم' },
    { icon: '🏆', text: 'عيسى الحربين حصل على أعلى متوسط تقييم عام (82) من تقرير واحد' },
    { icon: '📈', text: 'اتجاه الأداء في تحسن: ارتفاع 5 نقاط في آخر تقريرين مقارنة بالأول' },
    { icon: '🗣️', text: 'متوسط كلمات المعلقين المحللين: 148 كلمة/دقيقة — أعلى من المتوسط العالمي' },
    { icon: '⚡', text: 'المعلقون سجلوا في المتوسط 12 لحظة ذروة حماس لكل مباراة' },
  ];

  container.innerHTML = facts.map(f => `
    <div class="stats-fact-card">
      <span class="stats-fact-icon">${f.icon}</span>
      <span class="stats-fact-text">${f.text}</span>
    </div>
  `).join('');
}

function animateStatsCounters() {
  const els = document.querySelectorAll('.view-statistics [data-count-target]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.countTarget);
        if (!target) return;
        const start = performance.now();
        const duration = 1200;
        const step = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(target * eased);
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });
  els.forEach(el => observer.observe(el));
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════
let settingsInitialized = false;
function initSettingsPage() {
  if (settingsInitialized) return;
  settingsInitialized = true;
  loadSettings();
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('thmanyah_settings') || '{}');
    if (saved.maxSize) { const el = document.getElementById('settingsMaxSize'); if (el) el.value = saved.maxSize; }
    if (saved.categories) { const el = document.getElementById('settingsCategories'); if (el) el.value = saved.categories; }
    if (saved.userName) { const el = document.getElementById('settingsUserName'); if (el) el.value = saved.userName; }
    if (saved.userRole) { const el = document.getElementById('settingsUserRole'); if (el) el.value = saved.userRole; }

    ['Transcription', 'Excitement', 'Quotes', 'Performance', 'Radar', 'PdfTranscription'].forEach(key => {
      const el = document.getElementById('settings' + key);
      if (el && saved['show' + key] !== undefined) el.checked = saved['show' + key];
    });
  } catch (e) { /* ignore */ }
}

function saveSettings() {
  const settings = {
    maxSize: document.getElementById('settingsMaxSize')?.value,
    categories: document.getElementById('settingsCategories')?.value,
    userName: document.getElementById('settingsUserName')?.value,
    userRole: document.getElementById('settingsUserRole')?.value,
    showTranscription: document.getElementById('settingsTranscription')?.checked,
    showExcitement: document.getElementById('settingsExcitement')?.checked,
    showQuotes: document.getElementById('settingsQuotes')?.checked,
    showPerformance: document.getElementById('settingsPerformance')?.checked,
    showRadar: document.getElementById('settingsRadar')?.checked,
    showPdfTranscription: document.getElementById('settingsPdfTranscription')?.checked,
    pageSize: document.getElementById('settingsPageSize')?.value,
    imageQuality: document.getElementById('settingsImageQuality')?.value,
  };

  localStorage.setItem('thmanyah_settings', JSON.stringify(settings));

  if (settings.maxSize) CONFIG.maxFileSizeMB = parseInt(settings.maxSize);

  // Update sidebar user info
  const userName = document.querySelector('.user-name');
  const userRole = document.querySelector('.user-role');
  const userAvatar = document.querySelector('.user-avatar');
  if (userName && settings.userName) userName.textContent = settings.userName;
  if (userRole && settings.userRole) userRole.textContent = settings.userRole;
  if (userAvatar && settings.userName) userAvatar.textContent = settings.userName.charAt(0);

  // Update welcome
  const welcomeTitle = document.querySelector('.dash-welcome-title');
  if (welcomeTitle && settings.userName) welcomeTitle.textContent = `مرحبًا، ${settings.userName.split(' ')[0]}`;

  showToast('تم حفظ الإعدادات بنجاح');
}

function resetSettings() {
  localStorage.removeItem('thmanyah_settings');
  settingsInitialized = false;
  initSettingsPage();
  showToast('تم إعادة تعيين الإعدادات');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toastMessage');
  if (!toast || !msgEl) return;
  msgEl.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ── Initialization ──
document.addEventListener('DOMContentLoaded', () => {
  initUpload();
  showView('home');

  // Sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.addEventListener('click', () => {
      if (sidebar && sidebar.classList.contains('open')) sidebar.classList.remove('open');
    });
  }

  // Nav items
  const navMap = ['home', 'upload', 'reports', 'statistics', 'stars', 'criteria', 'settings'];
  document.querySelectorAll('.nav-item').forEach((item, idx) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = navMap[idx];
      if (target === 'upload') { startNewAnalysis(); return; }
      showView(target);
    });
  });

  // Tab switching (for report detail view)
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab') && e.target.closest('.card-tabs')) {
      const tabs = e.target.closest('.card-tabs').querySelectorAll('.tab');
      tabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');

      const text = e.target.textContent.trim();
      if (text === 'جميع المعايير') filterCriteria('all');
      else if (text === 'نقاط القوة') filterCriteria('strengths');
      else if (text === 'يحتاج تحسين') filterCriteria('improvements');
    }
  });

  // Error modal close
  const errorClose = document.getElementById('errorClose');
  if (errorClose) errorClose.addEventListener('click', hideError);
  const errorModal = document.getElementById('errorModal');
  if (errorModal) errorModal.addEventListener('click', (e) => {
    if (e.target === errorModal) hideError();
  });

  // Load theme
  initTheme();
});

// ═══════════════════════════════════════════════════════════════
// THEME SWITCHER
// ═══════════════════════════════════════════════════════════════
function initTheme() {
  const saved = localStorage.getItem('thmanyah_theme') || 'thmanyah';
  applyTheme(saved);
}

function toggleTheme() {
  const current = document.body.getAttribute('data-theme') || 'thmanyah';
  const next = current === 'thmanyah' ? 'ananas' : 'thmanyah';
  applyTheme(next);
  localStorage.setItem('thmanyah_theme', next);
}

function applyTheme(theme) {
  if (theme === 'ananas') {
    document.body.setAttribute('data-theme', 'ananas');
  } else {
    document.body.removeAttribute('data-theme');
  }
  // Update switcher UI
  const options = document.querySelectorAll('.theme-option');
  options.forEach(opt => {
    opt.classList.toggle('active', opt.getAttribute('data-theme') === theme);
  });
}

// ═══════════════════════════════════════════════════════════════
// EXCEL EXPORT
// ═══════════════════════════════════════════════════════════════
function exportExcel() {
  if (!state.report) { showToast('لا يوجد تقرير لتصديره'); return; }
  const data = state.report;
  const rows = [];

  // Header info
  rows.push(['تقرير تحليل الأداء']);
  rows.push(['المعلق', data.commentator?.name || '']);
  rows.push(['القناة', data.commentator?.channel || '']);
  rows.push(['المباراة', `${data.match_info?.team_a} ${data.match_info?.score} ${data.match_info?.team_b}`]);
  rows.push(['البطولة', data.match_info?.competition || '']);
  rows.push(['التاريخ', data.match_info?.date || '']);
  rows.push(['التقييم العام', data.overall?.score, data.overall?.rating]);
  if (data.video_url) rows.push(['رابط الفيديو', data.video_url]);
  rows.push([]);

  // Categories
  rows.push(['المحور', 'الدرجة', 'التقييم']);
  if (data.categories) {
    data.categories.forEach(cat => {
      rows.push([cat.name, cat.score, cat.rating]);
      if (cat.criteria) {
        cat.criteria.forEach(cr => {
          rows.push(['  ' + cr.name, cr.score, cr.note || '']);
        });
      }
    });
  }
  rows.push([]);

  // Strengths & Improvements
  rows.push(['نقاط القوة']);
  (data.strengths || []).forEach(s => rows.push(['', s]));
  rows.push([]);
  rows.push(['مجالات التحسين']);
  (data.improvements || []).forEach(s => rows.push(['', s]));

  downloadCSV(rows, `تحليل-${data.commentator?.name || 'تقرير'}-${new Date().toISOString().slice(0,10)}.csv`);
}

function exportFilteredReportsExcel() {
  const reports = getFilteredReports();
  if (reports.length === 0) { showToast('لا توجد تقارير لتصديرها'); return; }

  const rows = [];
  rows.push(['المعلق', 'الدور', 'الفريق أ', 'النتيجة', 'الفريق ب', 'البطولة', 'التاريخ', 'التقييم العام', 'التصنيف', 'القناة', 'رابط الفيديو', 'التعليقات']);
  reports.forEach(r => {
    rows.push([r.commentator, r.role || 'معلق', r.teamA, r.score, r.teamB, r.competition, r.date, r.overallScore, r.rating, r.channel, r.video_url || '', r.comments || '']);
  });

  downloadCSV(rows, `تقارير-المعلقين-${new Date().toISOString().slice(0,10)}.csv`);
}

function exportFilteredReportsPDF() {
  showToast('جارٍ تصدير PDF للتقارير المحددة...');
  // For bulk PDF, generate a summary page
  const reports = getFilteredReports();
  if (reports.length === 0) { showToast('لا توجد تقارير لتصديرها'); return; }

  const container = document.createElement('div');
  container.style.cssText = 'padding:20px;max-width:800px;font-family:sans-serif;direction:rtl;';
  container.innerHTML = `
    <h1 style="text-align:center;margin-bottom:20px;">ملخص التقارير — ${reports.length} تقارير</h1>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#000;color:#fff;">
          <th style="padding:8px;text-align:right;">المعلق</th>
          <th style="padding:8px;text-align:right;">الدور</th>
          <th style="padding:8px;text-align:right;">المباراة</th>
          <th style="padding:8px;text-align:center;">التقييم</th>
          <th style="padding:8px;text-align:right;">التاريخ</th>
        </tr>
      </thead>
      <tbody>
        ${reports.map((r, i) => `
          <tr style="background:${i % 2 ? '#f7f4ee' : '#fff'};">
            <td style="padding:8px;">${r.commentator}</td>
            <td style="padding:8px;">${r.role || 'معلق'}</td>
            <td style="padding:8px;">${r.teamA} ${r.score} ${r.teamB}</td>
            <td style="padding:8px;text-align:center;font-weight:bold;color:${getScoreColor(r.overallScore)};">${r.overallScore}</td>
            <td style="padding:8px;">${r.date}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.body.appendChild(container);

  const loadAndExport = async () => {
    if (!window.html2pdf) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js');
    }
    await html2pdf().set({
      margin: [10, 10], filename: `ملخص-التقارير-${new Date().toISOString().slice(0,10)}.pdf`,
      html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(container).save();
    document.body.removeChild(container);
  };
  loadAndExport().catch(() => { document.body.removeChild(container); showToast('فشل تصدير PDF'); });
}

function exportStarsExcel() {
  const stars = getStarsData();
  if (stars.length === 0) { showToast('لا توجد بيانات'); return; }
  const rows = [['النجم', 'الدور', 'القناة', 'متوسط التقييم', 'عدد التقارير', 'الاتجاه']];
  stars.forEach(s => {
    rows.push([s.name, s.role, s.channel, s.avgScore, s.reports.length, s.trendLabel]);
  });
  downloadCSV(rows, `النجوم-${new Date().toISOString().slice(0,10)}.csv`);
}

function exportStarsPDF() {
  showToast('جارٍ تصدير تقارير النجوم...');
  // Re-use the stars grid content
  const grid = document.getElementById('starsGrid');
  if (!grid || !grid.innerHTML) { showToast('لا توجد بيانات'); return; }
  const loadAndExport = async () => {
    if (!window.html2pdf) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js');
    }
    await html2pdf().set({
      margin: [10, 10], filename: `تقارير-النجوم-${new Date().toISOString().slice(0,10)}.pdf`,
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 900 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css'] },
    }).from(grid).save();
  };
  loadAndExport().catch(() => showToast('فشل تصدير PDF'));
}

function downloadCSV(rows, filename) {
  const BOM = '\uFEFF';
  const csv = rows.map(row =>
    row.map(cell => {
      const s = String(cell ?? '').replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    }).join(',')
  ).join('\n');

  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`تم تصدير ${filename}`);
}

// ═══════════════════════════════════════════════════════════════
// STARS PAGE
// ═══════════════════════════════════════════════════════════════
let starsInitialized = false;
function initStarsPage() {
  if (starsInitialized) return;
  starsInitialized = true;
  renderStarsGrid();

  ['starsSearchInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => renderStarsGrid());
  });
  ['starsRoleFilter', 'starsTrendFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => renderStarsGrid());
  });
}

function getStarsData() {
  const starMap = {};
  DUMMY_REPORTS.forEach(r => {
    if (!starMap[r.commentator]) {
      starMap[r.commentator] = {
        name: r.commentator,
        role: r.role || 'معلق',
        channel: r.channel,
        reports: [],
      };
    }
    starMap[r.commentator].reports.push(r);
  });

  return Object.values(starMap).map(star => {
    const sorted = [...star.reports].sort((a, b) => a.date.localeCompare(b.date));
    const avgScore = Math.round(sorted.reduce((s, r) => s + r.overallScore, 0) / sorted.length);

    // Calculate trend
    let trend = 'stable';
    let trendLabel = 'مستقر';
    let trendDiff = 0;
    if (sorted.length >= 2) {
      const first = sorted[0].overallScore;
      const last = sorted[sorted.length - 1].overallScore;
      trendDiff = last - first;
      if (trendDiff >= 3) { trend = 'improving'; trendLabel = 'يتحسن'; }
      else if (trendDiff <= -3) { trend = 'declining'; trendLabel = 'يتراجع'; }
    }

    // Average categories
    const catNames = sorted[0].categories.map(c => c.name);
    const avgCats = catNames.map((name, i) => ({
      name,
      score: Math.round(sorted.reduce((s, r) => s + (r.categories[i]?.score || 0), 0) / sorted.length),
    }));

    return { ...star, avgScore, trend, trendLabel, trendDiff, sortedReports: sorted, avgCats };
  });
}

function renderStarsGrid() {
  const grid = document.getElementById('starsGrid');
  if (!grid) return;

  let stars = getStarsData();

  // Filters
  const search = document.getElementById('starsSearchInput')?.value.trim();
  if (search) {
    const q = search.toLowerCase();
    stars = stars.filter(s => s.name.includes(q));
  }
  const roleFilter = document.getElementById('starsRoleFilter')?.value;
  if (roleFilter && roleFilter !== 'all') {
    stars = stars.filter(s => s.role === roleFilter);
  }
  const trendFilter = document.getElementById('starsTrendFilter')?.value;
  if (trendFilter && trendFilter !== 'all') {
    stars = stars.filter(s => s.trend === trendFilter);
  }

  if (stars.length === 0) {
    grid.innerHTML = '<div class="reports-empty"><p>لا توجد نتائج مطابقة</p></div>';
    return;
  }

  grid.innerHTML = stars.map(star => {
    const trendIcon = star.trend === 'improving' ? '&#9650;' : star.trend === 'declining' ? '&#9660;' : '&#9644;';
    const trendSign = star.trendDiff > 0 ? '+' : '';

    // Progress SVG
    const points = star.sortedReports.map((r, i) => ({
      x: star.sortedReports.length === 1 ? 50 : (i / (star.sortedReports.length - 1)) * 100,
      y: 100 - r.overallScore,
    }));
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return `
    <div class="star-card">
      <div class="star-card-header">
        <div class="star-card-avatar">${star.name.charAt(0)}</div>
        <div class="star-card-info">
          <span class="star-card-name">${star.name}</span>
          <span class="star-card-role">${star.role} — ${star.channel}</span>
          <span class="star-card-channel">${star.reports.length} تقارير خلال آخر 3 أشهر</span>
        </div>
        <div class="star-card-score" style="background:${getScoreColor(star.avgScore)}20;">
          <span class="star-card-score-num" style="color:${getScoreColor(star.avgScore)};">${star.avgScore}</span>
          <span class="star-card-score-label" style="color:${getScoreColor(star.avgScore)};">متوسط التقييم</span>
          <span class="star-card-trend ${star.trend}">${trendIcon} ${trendSign}${star.trendDiff} ${star.trendLabel}</span>
        </div>
      </div>
      <div class="star-card-body">
        <!-- Progress Chart -->
        <div class="star-progress-chart">
          <svg viewBox="-5 0 110 110" class="star-progress-svg" preserveAspectRatio="none">
            <line x1="0" y1="25" x2="100" y2="25" stroke="#EFEDE2" stroke-width="0.5"/>
            <line x1="0" y1="50" x2="100" y2="50" stroke="#EFEDE2" stroke-width="0.5"/>
            <line x1="0" y1="75" x2="100" y2="75" stroke="#EFEDE2" stroke-width="0.5"/>
            ${points.length > 1 ? `
              <path d="${pathD} L ${points[points.length-1].x} 100 L ${points[0].x} 100 Z" fill="rgba(0,193,122,0.06)" />
              <path d="${pathD}" fill="none" stroke="${getScoreColor(star.avgScore)}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            ` : ''}
            ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${getScoreColor(star.avgScore)}" stroke="#fff" stroke-width="2"/>`).join('')}
          </svg>
        </div>

        <!-- Category Averages -->
        <div class="star-cats-grid">
          ${star.avgCats.map(c => `
            <div class="star-cat-mini">
              <span class="star-cat-mini-score" style="color:${getScoreColor(c.score)};">${c.score}</span>
              <span class="star-cat-mini-name">${c.name}</span>
            </div>
          `).join('')}
        </div>

        <!-- Timeline -->
        <div class="star-timeline">
          <h4 class="star-timeline-title">&#128197; مسار الأداء — Timeline</h4>
          <div class="star-timeline-entries">
            ${star.sortedReports.map(r => `
              <div class="star-timeline-entry">
                <span class="star-timeline-date">${r.date}</span>
                <span class="star-timeline-match">${r.teamA} ${r.score} ${r.teamB}</span>
                <span class="star-timeline-score" style="background:${getScoreColor(r.overallScore)}15;color:${getScoreColor(r.overallScore)};">${r.overallScore}</span>
                ${r.video_url ? `<a href="${r.video_url}" target="_blank" rel="noopener" class="star-timeline-video"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> فيديو</a>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// CRITERIA PAGE — Role-Based Standards
// ═══════════════════════════════════════════════════════════════
const ROLE_CRITERIA = {
  commentator: {
    title: 'معايير تقييم المعلقين',
    description: '8 محاور رئيسية و32 معيارًا فرعيًا تغطي كل جوانب أداء المعلق الرياضي',
    sections: [
      { name: 'الأداء الصوتي', criteria: ['وضوح النطق والإلقاء', 'التنوع في طبقات الصوت', 'إيقاع وسرعة الكلام', 'إدارة فترات الصمت'] },
      { name: 'اللغة والأسلوب', criteria: ['سلامة اللغة العربية', 'ثراء المفردات', 'البلاغة والتعبيرات', 'الأسلوب السردي'] },
      { name: 'التحليل التكتيكي', criteria: ['قراءة التشكيلات والخطط', 'تفسير القرارات التكتيكية', 'دقة المعلومات والإحصائيات', 'الإعداد والتحضير المسبق'] },
      { name: 'تغطية الأحداث', criteria: ['وصف اللعب لحظة بلحظة', 'تعليق الأهداف واللحظات الحاسمة', 'التزامن مع الصورة', 'تغطية الإعادات'] },
      { name: 'التوازن العاطفي', criteria: ['الحياد وعدم الانحياز', 'التعامل مع قرارات الحكم', 'إدارة الانفعالات', 'الاحترافية في المواقف الصعبة'] },
      { name: 'التفاعل مع المشاهد', criteria: ['بناء الإثارة والتشويق', 'إضافة قيمة معرفية', 'التواصل مع المحلل', 'الخاتمة والتلخيص'] },
      { name: 'المعرفة الرياضية', criteria: ['معرفة تاريخ اللاعبين', 'الإلمام بسياق البطولة', 'المراجع التاريخية والمقارنات', 'معرفة القوانين واللوائح'] },
      { name: 'الإبداع والتميز', criteria: ['أسلوب تعليق فريد', 'عبارات وتعبيرات لا تُنسى', 'القدرة على السرد القصصي', 'اتساق الهوية الشخصية'] },
    ],
  },
  presenter: {
    title: 'معايير تقييم المقدمين',
    description: '8 محاور رئيسية تغطي أداء مقدمي البرامج والاستوديوهات الرياضية',
    sections: [
      { name: 'الأداء الصوتي والبصري', criteria: ['وضوح النطق والإلقاء', 'الحضور أمام الكاميرا', 'لغة الجسد والتعبيرات', 'المظهر المهني'] },
      { name: 'اللغة والأسلوب', criteria: ['سلامة اللغة العربية', 'وضوح الأسئلة والتعليقات', 'التنوع في صياغة الأسئلة', 'القدرة على التلخيص'] },
      { name: 'إدارة الحوار', criteria: ['توزيع الوقت بين الضيوف', 'التحكم في إيقاع الحلقة', 'إدارة الخلافات', 'مهارات الاستماع الفعال'] },
      { name: 'تغطية المحاور', criteria: ['تناول جميع المحاور المطلوبة', 'الربط بين المحاور', 'مرونة التنقل بين المواضيع', 'تقديم المعلومات الأساسية'] },
      { name: 'التوازن والحياد', criteria: ['الحياد تجاه الأندية', 'عدم التأثر بالضيوف', 'الموضوعية في الطرح', 'احترام وجهات النظر المختلفة'] },
      { name: 'التفاعل مع الضيوف', criteria: ['بناء علاقة مع الضيف', 'طرح أسئلة معمقة', 'ردود فعل ذكية', 'تقديم الضيوف بشكل مناسب'] },
      { name: 'المعرفة الرياضية', criteria: ['الإلمام بالأحداث الرياضية', 'معرفة اللاعبين والأندية', 'متابعة آخر المستجدات', 'فهم السياق الرياضي'] },
      { name: 'الحضور والكاريزما', criteria: ['القدرة على جذب الانتباه', 'بناء التشويق والإثارة', 'الانتقالات السلسة', 'ختام مؤثر وملخص'] },
    ],
  },
  reporter: {
    title: 'معايير تقييم المراسلين',
    description: '8 محاور لتقييم أداء المراسلين الميدانيين في التغطيات الرياضية',
    sections: [
      { name: 'الأداء الصوتي', criteria: ['وضوح الصوت في الميدان', 'سرعة الإلقاء المناسبة', 'التعامل مع الضوضاء المحيطة', 'نبرة مهنية وواثقة'] },
      { name: 'اللغة والأسلوب', criteria: ['سلامة اللغة تحت الضغط', 'إيجاز المعلومات', 'وضوح التقارير', 'بناء تقرير متسلسل'] },
      { name: 'دقة المعلومات', criteria: ['صحة الأخبار والمعلومات', 'التحقق من المصادر', 'تحديث المعلومات أولًا بأول', 'تجنب الإشاعات'] },
      { name: 'سرعة النقل', criteria: ['سرعة الوصول للخبر', 'التقاط اللحظات المهمة', 'المباشرة والفورية', 'الجاهزية للتغطية الطارئة'] },
      { name: 'التواصل مع الاستوديو', criteria: ['الرد على أسئلة المقدم', 'التنسيق مع فريق البث', 'سلاسة التحول من وإلى الاستوديو', 'إضافة سياق للاستوديو'] },
      { name: 'التحضير والإعداد', criteria: ['جمع المعلومات المسبقة', 'معرفة تفاصيل الحدث', 'تحضير زوايا مختلفة للتقرير', 'الإعداد التقني'] },
      { name: 'التعامل مع المواقف', criteria: ['الهدوء تحت الضغط', 'التكيف مع التغييرات المفاجئة', 'التعامل مع المواقف الصعبة', 'الاحترافية في الأزمات'] },
      { name: 'الحضور الميداني', criteria: ['اختيار الموقع المناسب', 'التفاعل مع البيئة المحيطة', 'نقل الأجواء الحقيقية', 'بناء علاقات مع المصادر'] },
    ],
  },
  analyst: {
    title: 'معايير تقييم المحللين',
    description: '8 محاور لتقييم المحللين الرياضيين والخبراء التكتيكيين',
    sections: [
      { name: 'الأداء الصوتي', criteria: ['وضوح الشرح والتوضيح', 'إيقاع العرض', 'استخدام نبرة مقنعة', 'التحكم في الصوت'] },
      { name: 'اللغة والأسلوب', criteria: ['استخدام المصطلحات الصحيحة', 'تبسيط المفاهيم المعقدة', 'بناء حجج منطقية', 'التوازن بين التخصص والبساطة'] },
      { name: 'عمق التحليل', criteria: ['تحليل الأسباب وليس النتائج فقط', 'ربط الأحداث ببعضها', 'تقديم رؤى جديدة', 'التنبؤ بسيناريوهات محتملة'] },
      { name: 'قراءة التشكيلات', criteria: ['فهم التشكيلات والأنظمة', 'رصد التغييرات التكتيكية', 'تحليل نقاط القوة والضعف', 'مقارنة الأساليب'] },
      { name: 'الموضوعية', criteria: ['الحياد في التحليل', 'الاعتراف بالأخطاء', 'عدم الانحياز لطرف', 'تقديم وجهات نظر متعددة'] },
      { name: 'التفاعل مع المعلق/المقدم', criteria: ['الرد السريع والمفيد', 'إثراء الحوار', 'عدم المقاطعة', 'التكامل مع فريق البث'] },
      { name: 'استخدام البيانات', criteria: ['الاستشهاد بالإحصائيات', 'تفسير الأرقام بشكل مفهوم', 'استخدام المقارنات', 'دعم التحليل بالأدلة'] },
      { name: 'وضوح الشرح', criteria: ['استخدام أمثلة واضحة', 'التوضيح بالرسومات إن أمكن', 'تدرج الشرح من البسيط للمعقد', 'تلخيص النقاط الرئيسية'] },
    ],
  },
};

let criteriaInitialized = false;
function initCriteriaPage() {
  if (criteriaInitialized) return;
  criteriaInitialized = true;
  switchCriteriaRole('commentator');
}

function switchCriteriaRole(role) {
  // Update tabs
  document.querySelectorAll('.criteria-role-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  const tabMap = { commentator: 0, presenter: 1, reporter: 2, analyst: 3 };
  document.querySelectorAll('.criteria-role-tab')[tabMap[role]]?.classList.add('active');

  const container = document.getElementById('criteriaRoleContent');
  if (!container) return;

  const data = ROLE_CRITERIA[role];
  if (!data) return;

  let num = 0;
  container.innerHTML = `
    <div style="margin-bottom:var(--space-4);">
      <h3 style="font-family:var(--font-display);font-weight:900;font-size:24px;margin-bottom:var(--space-2);">${data.title}</h3>
      <p style="font-size:14px;color:var(--color-muted);line-height:1.7;font-weight:500;">${data.description}</p>
    </div>
    ${data.sections.map(section => `
      <div class="criteria-role-section">
        <h4 class="criteria-role-section-title">
          <span class="criteria-dot" style="background:var(--color-green);"></span>
          ${section.name}
        </h4>
        <div class="criteria-role-list">
          ${section.criteria.map(cr => {
            num++;
            return `
              <div class="criteria-role-item">
                <span class="criteria-role-num">${num}</span>
                <div class="criteria-role-item-info">
                  <span class="criteria-role-item-name">${cr}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('')}
  `;
}
