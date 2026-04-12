// Basecamp Analytics — configuration
//
// Reads from the parent dashboard's config if embedded, otherwise
// uses its own defaults. The Supabase publishable key is safe to
// ship in a browser — every table is protected by RLS.

window.BASECAMP_CONFIG = {
  SUPABASE_URL: 'https://hbnvbfcwrfanpayxulih.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_P_AoE0x-HsqrJTarwZOT7Q_0UE2trZv',

  // Basecamp 3 API base. The account ID is appended at runtime after
  // the user configures their Basecamp account.
  BASECAMP_API_BASE: 'https://3.basecampapi.com',

  // Basecamp OAuth 2.0 endpoints (37signals Launchpad)
  BASECAMP_AUTH_URL: 'https://launchpad.37signals.com/authorization/new',
  BASECAMP_TOKEN_URL: 'https://launchpad.37signals.com/authorization/token',
  BASECAMP_LAUNCH_URL: 'https://launchpad.37signals.com/authorization.json',

  // Rate limiting: Basecamp allows 50 requests per 10 seconds.
  RATE_LIMIT_MAX: 50,
  RATE_LIMIT_WINDOW_MS: 10000,

  // Default page size for paginated endpoints.
  PAGE_SIZE: 50,
};
