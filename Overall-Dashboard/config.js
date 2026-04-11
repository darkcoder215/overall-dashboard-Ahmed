// Overall Dashboard — Supabase client config.
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
  // Each key matches a `slug` in tools.js / public.tools. When the
  // dashboard opens a tool it first looks here — so after you deploy
  // the individual tools to Vercel you just paste their production
  // URLs below and everything keeps working in-place (iframe) without
  // touching the registry. Leave a slug out to fall back to tool.url
  // from the DB / STATIC_TOOLS entry.
  TOOL_URLS: {
    // When deployed alongside the dashboard under the root vercel.json
    // the Commentator tool is exposed at `/commentator`.
    'commentator': '/commentator',

    // Replace the four below with the production URLs of the individual
    // Vercel projects for each tool before going live.
    // 'chatbot':          'https://thmanyah-chatbot.vercel.app',
    // 'social-listening': 'https://thmanyah-social-listening.vercel.app',
    // 'podcast-video':    'https://thmanyah-podcast-video.vercel.app',
    // 'hr-approval':      'https://thmanyah-hr-approval.vercel.app',
    // 'feedback-platform':'https://thmanyah-feedback-platform.vercel.app',
  },
};
