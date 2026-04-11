// ═══════════════════════════════════════════════════════════════════
// Overall Dashboard — app logic
// Vanilla JS + Supabase JS (loaded from CDN as an ES module).
// ═══════════════════════════════════════════════════════════════════

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { STATIC_TOOLS, ICONS, CATEGORY_LABELS, TOOL_ACCENTS } from './tools.js';

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
  // In-place tool tabs (each entry: { slug, tool, frameEl, pillEl })
  tabs: [],
  activeTabSlug: null,
  // Remembers the last non-tool view so we can return there when all tabs close.
  lastNonToolView: 'home',
};

// ── Init ─────────────────────────────────────────────────────────
function init() {
  loadTheme();
  attachNavListeners();
  attachSearchListeners();
  attachDelightListeners();
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
  // Guard: 'tool' view only makes sense when there's at least one open tab.
  if (view === 'tool' && state.tabs.length === 0) view = 'home';

  state.currentView = view;
  if (view !== 'tool') state.lastNonToolView = view;

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
  let title = titles[view] || '';
  if (view === 'tool') {
    const tab = state.tabs.find(t => t.slug === state.activeTabSlug);
    title = tab?.tool.name_ar || 'أداة';
  }
  document.getElementById('pageTitle').textContent = title;

  updateTopBarActions();
  renderAll();

  // Close mobile sidebar when navigating.
  document.getElementById('sidebar').classList.remove('open');
};

// ── Tool tabs (in-place iframe) ──────────────────────────────────
function resolveToolUrl(tool) {
  if (!tool) return '#';
  const overrides = (CONFIG && CONFIG.TOOL_URLS) || {};
  return overrides[tool.slug] || tool.url || '#';
}

function openToolInTab(tool) {
  if (!tool || tool.enabled === false) return;
  logToolOpen(tool);

  const slug = tool.slug || tool.id || tool.name_en;
  const existing = state.tabs.find(t => t.slug === slug);
  if (existing) {
    activateTab(slug);
    window.navigateTo('tool');
    return;
  }

  const framesMount = document.getElementById('tabsFrames');
  const emptyPlaceholder = document.getElementById('tabsFramesEmpty');
  if (emptyPlaceholder) emptyPlaceholder.hidden = true;

  // Build iframe
  const frame = document.createElement('iframe');
  frame.className = 'tab-frame';
  frame.src = resolveToolUrl(tool);
  frame.title = tool.name_ar || tool.name_en || 'أداة';
  frame.setAttribute(
    'allow',
    'clipboard-read; clipboard-write; microphone; camera; fullscreen; autoplay; geolocation; encrypted-media'
  );
  frame.setAttribute(
    'sandbox',
    'allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads allow-pointer-lock'
  );
  frame.setAttribute('loading', 'lazy');
  frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  framesMount.appendChild(frame);

  // Build pill
  const iconSvg = ICONS[tool.icon] || ICONS['layout-grid'];
  const pill = document.createElement('div');
  pill.className = 'tab-pill';
  pill.setAttribute('role', 'tab');
  pill.setAttribute('aria-label', tool.name_ar || tool.name_en);
  pill.innerHTML = `
    <span class="tab-pill-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>
    </span>
    <span class="tab-pill-label">${escapeHtml(tool.name_ar || tool.name_en)}</span>
    <button class="tab-pill-close" data-close aria-label="إغلاق">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  pill.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) {
      e.stopPropagation();
      closeTab(slug);
      return;
    }
    activateTab(slug);
    window.navigateTo('tool');
  });
  document.getElementById('tabsStrip').appendChild(pill);

  state.tabs.push({ slug, tool, frameEl: frame, pillEl: pill });
  activateTab(slug);
  updateTabsStripVisibility();
  window.navigateTo('tool');
}

function activateTab(slug) {
  state.activeTabSlug = slug;
  state.tabs.forEach(t => {
    t.frameEl.classList.toggle('active', t.slug === slug);
    t.pillEl.classList.toggle('active', t.slug === slug);
  });
  // Scroll pill into view on small screens.
  const active = state.tabs.find(t => t.slug === slug);
  if (active?.pillEl?.scrollIntoView) {
    active.pillEl.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }
}

function closeTab(slug) {
  const idx = state.tabs.findIndex(t => t.slug === slug);
  if (idx === -1) return;
  const tab = state.tabs[idx];
  tab.frameEl.remove();
  tab.pillEl.remove();
  state.tabs.splice(idx, 1);

  if (state.activeTabSlug === slug) {
    const next = state.tabs[idx] || state.tabs[idx - 1];
    if (next) {
      activateTab(next.slug);
      window.navigateTo('tool');
    } else {
      state.activeTabSlug = null;
      const empty = document.getElementById('tabsFramesEmpty');
      if (empty) empty.hidden = false;
      window.navigateTo(state.lastNonToolView || 'home');
    }
  }
  updateTabsStripVisibility();
}

function updateTabsStripVisibility() {
  const strip = document.getElementById('tabsStrip');
  if (strip) strip.hidden = state.tabs.length === 0;
}

function updateTopBarActions() {
  const isTool = state.currentView === 'tool';
  const reload = document.getElementById('reloadFrameBtn');
  const openNew = document.getElementById('openInNewTabBtn');
  const refresh = document.getElementById('refreshToolsBtn');
  const browse = document.getElementById('browseToolsBtn');
  if (reload) reload.hidden = !isTool;
  if (openNew) openNew.hidden = !isTool;
  if (refresh) refresh.hidden = isTool;
  if (browse) browse.hidden = isTool;
  if (isTool && openNew) {
    const tab = state.tabs.find(t => t.slug === state.activeTabSlug);
    openNew.href = tab ? resolveToolUrl(tab.tool) : '#';
  }
}

window.reloadActiveTab = function reloadActiveTab() {
  const tab = state.tabs.find(t => t.slug === state.activeTabSlug);
  if (!tab) return;
  // Re-assign src to force a reload (survives cross-origin restrictions).
  const url = tab.frameEl.src;
  tab.frameEl.src = 'about:blank';
  requestAnimationFrame(() => { tab.frameEl.src = url; });
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
// Cache the tool list fingerprint so we only re-paint the grids when
// the underlying data actually changed. Without this, `renderAll()`
// is called three times during bootstrap (static → auth → supabase
// refresh) and each call wipes `.innerHTML` mid-animation — the user
// sees a flash and the cascade entrance restarts or never finishes.
let __lastToolsFingerprint = '';
function toolsFingerprint() {
  // Include fields that affect rendering. Order matches how the grid
  // is displayed, so any meaningful change invalidates the fingerprint.
  return state.tools
    .map(t => `${t.id || t.slug}|${t.enabled ? 1 : 0}|${t.name_ar}|${t.position ?? ''}`)
    .join('~') + '::' + [...state.favorites].sort().join(',');
}

function renderAll() {
  // Reset the card stagger counter so each full render sends the cascade
  // from the first card again instead of continuing an ever-growing delay.
  resetCardStagger();
  renderStats();

  const fp = toolsFingerprint();
  if (fp !== __lastToolsFingerprint) {
    __lastToolsFingerprint = fp;
    renderHomeToolsGrid();
    renderAllToolsView();
    renderFavoritesView();
  }
}

// Force a re-render of the grids regardless of fingerprint (used when
// the visible filter/search changes without the underlying data).
function forceRenderGrids() {
  resetCardStagger();
  __lastToolsFingerprint = toolsFingerprint();
  renderHomeToolsGrid();
  renderAllToolsView();
  renderFavoritesView();
}

function renderStats() {
  const total = state.tools.length;
  const enabled = state.tools.filter(t => t.enabled).length;
  const favs = state.favorites.size;
  const cats = new Set(state.tools.map(t => t.category)).size;
  animateCount('statTotalTools', total);
  animateCount('statEnabledTools', enabled);
  animateCount('statFavorites', favs);
  animateCount('statCategories', cats);
}

// Counts a stat element from its current value up (or down) to `target`.
// Adds `.pulse` briefly so CSS can flash the accent colour.
function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const prev = parseInt(el.textContent, 10);
  const from = Number.isFinite(prev) ? prev : 0;
  if (from === target) { el.textContent = String(target); return; }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    el.textContent = String(target);
    return;
  }
  const duration = 420; // ms — short enough to feel snappy, long enough to notice
  const start = performance.now();
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const v = Math.round(from + (target - from) * easeOut(t));
    el.textContent = String(v);
    if (t < 1) requestAnimationFrame(step);
    else {
      el.textContent = String(target);
      el.classList.remove('pulse');
      // Force reflow so the animation can replay on the next update.
      void el.offsetWidth;
      el.classList.add('pulse');
    }
  }
  requestAnimationFrame(step);
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

// Global counter so every card rendered in a single tick gets a unique
// --card-index, which the CSS animation reads for the cascade effect.
let __cardRenderIndex = 0;
function resetCardStagger() { __cardRenderIndex = 0; }

function buildToolCard(tool) {
  const card = document.createElement('article');
  card.className = 'tool-card' + (tool.enabled === false ? ' disabled' : '');
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', tool.name_ar);
  const accent = TOOL_ACCENTS[tool.slug] || 'green';
  card.setAttribute('data-accent', accent);
  // Stagger entrance: every new card in this render pass waits a little
  // longer. Reset from renderAll() so the first card in each grid starts
  // fresh.
  card.style.setProperty('--card-index', String(__cardRenderIndex++));

  const iconSvg = ICONS[tool.icon] || ICONS['layout-grid'];
  const isFav = tool.id && state.favorites.has(tool.id);

  card.innerHTML = `
    <header class="tool-card-head">
      <div class="tool-card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>
      </div>
      <button class="tool-card-fav ${isFav ? 'active' : ''}" aria-label="إضافة للمفضلة" data-fav>
        <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </header>
    <div class="tool-card-body">
      <div class="tool-card-en">${escapeHtml(tool.name_en || '')}</div>
      <h3 class="tool-card-title">${escapeHtml(tool.name_ar)}</h3>
      <p class="tool-card-desc">${escapeHtml(tool.description_ar || '')}</p>
    </div>
    <footer class="tool-card-footer">
      <span class="tool-tag">${escapeHtml(CATEGORY_LABELS[tool.category] || tool.category || '')}</span>
      <span class="open-arrow">افتح الأداة
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      </span>
    </footer>
  `;

  // Favorite toggle (stops propagation so it doesn't also open the tool).
  const favBtn = card.querySelector('[data-fav]');
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Visual flourish: pop the star + emit sparkles even when the backend
    // save fails (e.g. guest user). Feels instant and clearly acknowledged.
    favBtn.classList.remove('popping');
    void favBtn.offsetWidth;
    favBtn.classList.add('popping');
    emitSparkles(favBtn, 6);
    toggleFavorite(tool);
  });

  const open = (e) => {
    if (tool.enabled === false) {
      // Polite head-shake. Also emit a tiny toast so the user knows why.
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      showToast('هذه الأداة قيد التحضير.');
      return;
    }
    openToolInTab(tool);
  };
  card.addEventListener('click', open);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); }
  });

  return card;
}

// Emits a few short-lived sparkle particles from a button. Each particle
// picks a random angle via CSS vars (--spx, --spy) so they fan outward.
function emitSparkles(target, count = 6) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 28 + Math.random() * 16;
    s.style.color = i % 2 === 0 ? '#FFBC0A' : 'rgb(var(--accent-rgb))';
    s.style.setProperty('--spx', `calc(-50% + ${Math.cos(angle) * dist}px)`);
    s.style.setProperty('--spy', `calc(-50% + ${Math.sin(angle) * dist}px)`);
    s.style.animationDelay = (i * 20) + 'ms';
    target.appendChild(s);
    setTimeout(() => s.remove(), 900 + i * 20);
  }
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

// ════════════════════════════════════════════════════════════════
// Delight layer — easter eggs and micro-interactions
// ════════════════════════════════════════════════════════════════

function attachDelightListeners() {
  // ── 7-click logo easter egg ───────────────────────────────────
  // Clicking the sidebar logo seven times in under 3 seconds fires
  // a small confetti burst and a friendly toast. Rewards the curious.
  const logo = document.querySelector('.sidebar-logo');
  if (logo) {
    let taps = 0;
    let resetTimer = null;
    logo.addEventListener('click', () => {
      taps += 1;
      logo.classList.remove('logo-pop');
      void logo.offsetWidth;
      logo.classList.add('logo-pop');
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { taps = 0; }, 3000);
      if (taps >= 7) {
        taps = 0;
        dropConfetti(60);
        showToast('٧ مرات؟ أنت مصمّم حقيقي. 🎉');
      } else if (taps === 5) {
        // Nudge at 5 — "two to go".
        showToast('اثنتان بعد… 👀');
      }
    });
  }

  // ── Konami code ────────────────────────────────────────────────
  // ↑ ↑ ↓ ↓ ← → ← → B A  — fires a bigger confetti shower and the
  // secret "developer mode" toast. Doesn't unlock anything, just fun.
  const konami = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a',
  ];
  let kIdx = 0;
  window.addEventListener('keydown', (e) => {
    // Ignore when typing in inputs.
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === konami[kIdx]) {
      kIdx += 1;
      if (kIdx === konami.length) {
        kIdx = 0;
        dropConfetti(120);
        showToast('وضع المطوّر مفعّل! (ليس فعلاً 🙂)');
      }
    } else {
      // Allow restart if the first key of the sequence matches.
      kIdx = key === konami[0] ? 1 : 0;
    }
  });

  // ── "T" for Thmanyah secret: pressing the key 'T' three times in a
  //    row turns the page theme upside down for a second. Tiny joke.
  let tTaps = 0;
  let tTimer = null;
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key !== 't' && e.key !== 'T') { tTaps = 0; return; }
    tTaps += 1;
    clearTimeout(tTimer);
    tTimer = setTimeout(() => { tTaps = 0; }, 1200);
    if (tTaps >= 3) {
      tTaps = 0;
      const main = document.querySelector('.main-content');
      if (!main) return;
      main.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
      main.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        main.style.transform = '';
        setTimeout(() => { main.style.transition = ''; }, 820);
      }, 820);
      showToast('دوّارة ثمانية 🌀');
    }
  });
}

// Spawns `count` confetti particles that fall from the top of the viewport.
// Uses CSS variables to randomize horizontal drift, duration, and spin.
function dropConfetti(count = 60) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  let layer = document.querySelector('.confetti-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'confetti-layer';
    document.body.appendChild(layer);
  }
  const colors = [
    '#00C17A', '#0072F9', '#F24935', '#FFBC0A', '#FF9172', '#FF4D00',
  ];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    const left = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 200; // ±100px horizontal
    const dur = 2.4 + Math.random() * 1.8;
    const rot = 360 + Math.random() * 720;
    const color = colors[i % colors.length];
    piece.style.left = left + 'vw';
    piece.style.background = color;
    piece.style.setProperty('--cfx', drift + 'px');
    piece.style.setProperty('--cfd', dur + 's');
    piece.style.setProperty('--cfr', rot + 'deg');
    piece.style.animationDelay = (Math.random() * 0.4) + 's';
    // Alternate shapes: rectangles and circles.
    if (i % 3 === 0) piece.style.borderRadius = '50%';
    if (i % 5 === 0) piece.style.width = '6px';
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), (dur + 0.6) * 1000);
  }
  // Tidy up the layer a moment after the longest animation completes.
  setTimeout(() => {
    if (layer && !layer.children.length) layer.remove();
  }, 5000);
}

// ── Boot ─────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
