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
};
