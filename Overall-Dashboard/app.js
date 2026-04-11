// ═══════════════════════════════════════════════════════════════════
// Overall Dashboard — app logic
// Vanilla JS + Supabase JS (loaded from CDN as an ES module).
// ═══════════════════════════════════════════════════════════════════

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { STATIC_TOOLS, ICONS, CATEGORY_LABELS } from './tools.js';

const CONFIG = window.DASHBOARD_CONFIG || {};

// ── Global state ─────────────────────────────────────────────────
const state = {
  supabase: null,
  user: null,
  profile: null,
  tools: [],
  favorites: new Set(),
  currentView: 'home',
  searchQuery: '',
  activeCategory: 'all',
  connectionOk: false,
};

// ── Init ─────────────────────────────────────────────────────────
function init() {
  loadTheme();
  attachNavListeners();
  attachSearchListeners();
  initSupabase();
  bootstrap();
}

function initSupabase() {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_PUBLISHABLE_KEY) {
    console.warn('[dashboard] Supabase config missing, running in static mode.');
    return;
  }
  try {
    state.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  } catch (err) {
    console.error('[dashboard] failed to create supabase client:', err);
  }
}

async function bootstrap() {
  // 1. Render static tools immediately so the page is never blank.
  state.tools = [...STATIC_TOOLS];
  renderAll();

  // 2. Try to get the current Supabase session.
  if (state.supabase) {
    const { data: { session } } = await state.supabase.auth.getSession();
    if (session) await onSignedIn(session.user);
    state.supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (sess?.user) await onSignedIn(sess.user);
      else onSignedOut();
    });
  }

  // 3. Best-effort refresh the registry from Supabase.
  await refreshTools();

  // 4. Update connection badge.
  updateConnectionBadge();
}

// ── Sign in / sign out side-effects ──────────────────────────────
async function onSignedIn(user) {
  state.user = user;
  // Try to load the profile row.
  const { data, error } = await state.supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .maybeSingle();
  if (!error && data) state.profile = data;
  updateUserChrome();

  // Load favorites.
  const { data: favs } = await state.supabase
    .from('tool_favorites')
    .select('tool_id');
  state.favorites = new Set((favs || []).map(f => f.tool_id));

  // Log the login action (append-only, RLS enforces user_id = auth.uid()).
  state.supabase
    .from('audit_logs')
    .insert({ user_id: user.id, action: 'login', metadata: {} });

  renderAll();
  showToast(`مرحبًا ${state.profile?.full_name || user.email}`);
}

function onSignedOut() {
  state.user = null;
  state.profile = null;
  state.favorites = new Set();
  updateUserChrome();
  renderAll();
}

// ── Fetch tools (fallback silent) ────────────────────────────────
window.refreshTools = async function refreshTools() {
  if (!state.supabase) { state.connectionOk = false; updateConnectionBadge(); return; }
  try {
    const { data, error } = await state.supabase
      .from('tools')
      .select('id, slug, name_ar, name_en, description_ar, category, icon, url, enabled, position')
      .order('position', { ascending: true });
    if (error) throw error;
    if (Array.isArray(data) && data.length > 0) {
      // Merge: keep DB rows; fall back to STATIC_TOOLS entries without `id`.
      state.tools = data;
    }
    state.connectionOk = true;
  } catch (err) {
    console.warn('[dashboard] Tool refresh failed, using static registry:', err.message);
    state.connectionOk = false;
  }
  updateConnectionBadge();
  renderAll();
};

// ── Views / navigation ───────────────────────────────────────────
function attachNavListeners() {
  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(el.dataset.view);
    });
  });
}

window.navigateTo = function navigateTo(view) {
  state.currentView = view;
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('view-active', v.dataset.view === view);
  });
  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  const titles = {
    home: 'الرئيسية',
    tools: 'كل الأدوات',
    favorites: 'المفضلة',
    activity: 'النشاط',
    settings: 'الإعدادات',
  };
  document.getElementById('pageTitle').textContent = titles[view] || '';
  renderAll();

  // Close mobile sidebar when navigating.
  document.getElementById('sidebar').classList.remove('open');
};

window.toggleSidebar = function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
};

// ── Theme ────────────────────────────────────────────────────────
window.toggleTheme = function toggleTheme() {
  const current = document.body.getAttribute('data-theme') || 'thmanyah';
  applyTheme(current === 'thmanyah' ? 'ananas' : 'thmanyah');
};

function applyTheme(theme) {
  if (theme === 'ananas') document.body.setAttribute('data-theme', 'ananas');
  else document.body.removeAttribute('data-theme');
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.getAttribute('data-theme') === theme);
  });
  try { localStorage.setItem('dashboard.theme', theme); } catch {}
}

function loadTheme() {
  let theme = 'thmanyah';
  try { theme = localStorage.getItem('dashboard.theme') || 'thmanyah'; } catch {}
  applyTheme(theme);
}

// ── Rendering ────────────────────────────────────────────────────
function renderAll() {
  renderStats();
  renderHomeToolsGrid();
  renderAllToolsView();
  renderFavoritesView();
}

function renderStats() {
  const total = state.tools.length;
  const enabled = state.tools.filter(t => t.enabled).length;
  const favs = state.favorites.size;
  const cats = new Set(state.tools.map(t => t.category)).size;
  setText('statTotalTools', String(total));
  setText('statEnabledTools', String(enabled));
  setText('statFavorites', String(favs));
  setText('statCategories', String(cats));
  const ring = document.getElementById('welcomeRingCount');
  if (ring) ring.textContent = String(enabled);
}

function renderHomeToolsGrid() {
  const mount = document.getElementById('toolsGrid');
  if (!mount) return;
  mount.innerHTML = '';
  const visible = state.tools
    .filter(t => t.enabled)
    .slice(0, 6);
  visible.forEach(t => mount.appendChild(buildToolCard(t)));
  setText('toolsSectionSub', `${visible.length} ${visible.length === 1 ? 'أداة' : 'أدوات'} متاحة — اضغط لفتحها`);
}

function renderAllToolsView() {
  const mount = document.getElementById('allToolsGrid');
  if (!mount) return;
  mount.innerHTML = '';
  let list = state.tools;
  if (state.activeCategory !== 'all') {
    list = list.filter(t => t.category === state.activeCategory);
  }
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(t =>
      (t.name_ar || '').toLowerCase().includes(q) ||
      (t.name_en || '').toLowerCase().includes(q) ||
      (t.description_ar || '').toLowerCase().includes(q)
    );
  }
  if (!list.length) {
    mount.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><p>لا توجد أدوات مطابقة.</p></div>`;
    return;
  }
  list.forEach(t => mount.appendChild(buildToolCard(t)));
}

function renderFavoritesView() {
  const mount = document.getElementById('favoritesGrid');
  const empty = document.getElementById('favoritesEmpty');
  if (!mount) return;
  mount.innerHTML = '';
  const favList = state.tools.filter(t => t.id && state.favorites.has(t.id));
  if (favList.length === 0) {
    if (empty) empty.hidden = false;
    mount.hidden = true;
    return;
  }
  if (empty) empty.hidden = true;
  mount.hidden = false;
  favList.forEach(t => mount.appendChild(buildToolCard(t)));
}

function buildToolCard(tool) {
  const card = document.createElement('div');
  card.className = 'tool-card' + (tool.enabled === false ? ' disabled' : '');
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', tool.name_ar);

  const iconSvg = ICONS[tool.icon] || ICONS['layout-grid'];
  const isFav = tool.id && state.favorites.has(tool.id);

  card.innerHTML = `
    <div class="tool-card-head">
      <div class="tool-card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>
      </div>
      <button class="tool-card-fav ${isFav ? 'active' : ''}" aria-label="إضافة للمفضلة" data-fav>
        <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>
    <div>
      <div class="tool-card-title">${escapeHtml(tool.name_ar)}</div>
      <div class="tool-card-en">${escapeHtml(tool.name_en)}</div>
    </div>
    <p class="tool-card-desc">${escapeHtml(tool.description_ar || '')}</p>
    <div class="tool-card-footer">
      <span class="tool-tag">${escapeHtml(CATEGORY_LABELS[tool.category] || tool.category)}</span>
      <span class="open-arrow">فتح الأداة ←</span>
    </div>
  `;

  // Favorite toggle (stops propagation so it doesn't also open the tool).
  card.querySelector('[data-fav]').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(tool);
  });

  const open = (e) => {
    if (tool.enabled === false) return;
    logToolOpen(tool);
    // Open in a new tab so the dashboard stays mounted.
    window.open(tool.url, '_blank', 'noopener,noreferrer');
  };
  card.addEventListener('click', open);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); }
  });

  return card;
}

// ── Favorites ────────────────────────────────────────────────────
async function toggleFavorite(tool) {
  if (!state.user || !state.supabase || !tool.id) {
    showToast('سجّل الدخول أولًا لحفظ المفضلة');
    return;
  }
  const already = state.favorites.has(tool.id);
  if (already) {
    state.favorites.delete(tool.id);
    await state.supabase
      .from('tool_favorites')
      .delete()
      .eq('tool_id', tool.id);
    await state.supabase
      .from('audit_logs')
      .insert({ user_id: state.user.id, tool_id: tool.id, action: 'unfavorite' });
  } else {
    state.favorites.add(tool.id);
    await state.supabase
      .from('tool_favorites')
      .insert({ user_id: state.user.id, tool_id: tool.id });
    await state.supabase
      .from('audit_logs')
      .insert({ user_id: state.user.id, tool_id: tool.id, action: 'favorite' });
  }
  renderAll();
}

// ── Audit log: tool open ─────────────────────────────────────────
async function logToolOpen(tool) {
  if (!state.user || !state.supabase || !tool.id) return;
  try {
    await state.supabase
      .from('audit_logs')
      .insert({
        user_id: state.user.id,
        tool_id: tool.id,
        action: 'open',
        metadata: { slug: tool.slug, url: tool.url },
      });
  } catch (err) {
    console.warn('[dashboard] audit log insert failed:', err.message);
  }
}

// ── Filter bar ───────────────────────────────────────────────────
function attachSearchListeners() {
  const search = document.getElementById('toolsSearch');
  if (search) search.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    renderAllToolsView();
  });
  document.querySelectorAll('#toolsFilterChips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.activeCategory = chip.dataset.category;
      document.querySelectorAll('#toolsFilterChips .chip').forEach(c =>
        c.classList.toggle('chip-active', c === chip)
      );
      renderAllToolsView();
    });
  });
}

// ── Auth modal ───────────────────────────────────────────────────
window.handleAuthClick = function handleAuthClick() {
  if (state.user) return signOut();
  openAuthModal();
};

function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.hidden = false;
  const firstInput = modal.querySelector('input[name="email"]');
  if (firstInput) firstInput.focus();
}
window.closeAuthModal = function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.hidden = true;
  const err = document.getElementById('authError');
  if (err) err.hidden = true;
};

window.submitAuth = async function submitAuth(event) {
  event.preventDefault();
  if (!state.supabase) {
    showToast('Supabase غير متصل — العمل في وضع الضيف');
    return false;
  }
  const form = event.target;
  const email = form.email.value.trim();
  const password = form.password.value;
  const errEl = document.getElementById('authError');
  errEl.hidden = true;
  try {
    const { error } = await state.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    closeAuthModal();
  } catch (err) {
    errEl.textContent = err.message || 'فشل تسجيل الدخول';
    errEl.hidden = false;
  }
  return false;
};

async function signOut() {
  if (!state.supabase) return;
  await state.supabase.auth.signOut();
  showToast('تم تسجيل الخروج');
}

// ── Chrome (user avatar / name / connection badge) ───────────────
function updateUserChrome() {
  const name = state.profile?.full_name || state.user?.email || 'ضيف';
  const initials = (name || '?').trim().charAt(0).toUpperCase();
  setText('userAvatar', initials);
  setText('userName', name);
  setText('userRole', state.user ? (state.profile?.role || 'member') : 'غير مسجل الدخول');
  setText('settingsUserEmail', state.user?.email || 'غير مسجل الدخول');
  const btn = document.getElementById('authBtn');
  if (btn) btn.textContent = state.user ? 'تسجيل الخروج' : 'تسجيل الدخول';
}

function updateConnectionBadge() {
  const badge = document.getElementById('settingsConnBadge');
  const state_ = document.getElementById('settingsConnState');
  if (!badge || !state_) return;
  if (!state.supabase) {
    badge.textContent = 'غير مُهيّأ';
    badge.className = 'badge badge-warn';
    state_.textContent = 'إعدادات Supabase غير مضبوطة — وضع ثابت.';
    return;
  }
  if (state.connectionOk) {
    badge.textContent = 'متصل';
    badge.className = 'badge badge-ok';
    state_.textContent = CONFIG.SUPABASE_URL;
  } else {
    badge.textContent = 'غير متصل';
    badge.className = 'badge badge-err';
    state_.textContent = 'تعذر الاتصال — يتم عرض السجل الثابت.';
  }
}

// ── Utils ────────────────────────────────────────────────────────
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
}

// ── Boot ─────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
