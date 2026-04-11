// Overall Dashboard — Supabase + routing config.
//
// The publishable (anon) key below is safe to ship in a browser: it is
// rate-limited at the edge and every table is protected by Row-Level
// Security. Never replace this with the service-role key.
//
// If you fork this dashboard for another Supabase project, copy this file
// to `config.local.js`, update the values, and load it instead of this one.
window.DASHBOARD_CONFIG = {
  SUPABASE_URL: 'https://hbnvbfcwrfanpayxulih.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_P_AoE0x-HsqrJTarwZOT7Q_0UE2trZv',

  // When true the dashboard requires sign-in before showing tool cards.
  // When false it still works in offline/static mode using the fallback
  // registry defined in tools.js.
  REQUIRE_AUTH: false,

  // ── Tool URL overrides ─────────────────────────────────────────
  // Each key matches a `slug` in tools.js / public.tools. The unified
  // `build.sh` at the repo root builds every tool into a subdirectory
  // of the root Vercel deploy — so they all share the same origin as
  // the dashboard and iframing them just works (no CSP frame-ancestors,
  // no cross-origin cookies). Leave a slug pointing at a same-origin
  // path, or override with an absolute URL if you'd rather consume a
  // tool from a separate Vercel project.
  TOOL_URLS: {
    'commentator':       '/commentator/',
    'chatbot':           '/chatbot/',
    'social-listening':  '/social-listening/',
    'podcast-video':     '/podcast-video/',
    'hr-approval':       '/hr-approval/',
    'feedback-platform': '/feedback-platform/',
  },
};
