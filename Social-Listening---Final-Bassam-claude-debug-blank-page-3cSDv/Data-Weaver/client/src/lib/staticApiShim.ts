// Static-deploy API shim for Social Listening.
//
// The Social Listening client is built as a pure static bundle (Vite
// `dist/public`), but its pages fetch data from an Express backend at
// `/api/*` that only exists in dev. In the unified Vercel deploy there is
// no Express server — so this shim intercepts those calls and returns a
// structurally-valid "empty" payload. The UI renders "no data" states
// instead of crashing on network errors or `res.json()` parse failures.
//
// Activated by `main.tsx` only when `import.meta.env.PROD` is true, so dev
// behaviour is untouched. If you ever deploy a real backend behind the same
// origin, delete this file and the `installStaticApiShim()` call.

type ShimResponseBody = unknown;

const SAFE_MODE_PAYLOAD = {
  enabled: false,
  message: "",
} as const;

// Endpoints that return an array of rows — `rows: []` keeps the data
// wrappers happy while giving the UI an obvious empty state.
const EMPTY_ROWS: ShimResponseBody = { rows: [], total: 0 };

// Endpoints that return a generic envelope with `data`.
const EMPTY_DATA: ShimResponseBody = { data: [], items: [], total: 0 };

// Dashboard stats — return zeros so the cards render "0" instead of NaN.
const EMPTY_STATS: ShimResponseBody = {
  totalPosts: 0,
  totalEngagement: 0,
  avgSentiment: 0,
  platforms: [],
  topHashtags: [],
  recentActivity: [],
};

function matchRoute(pathname: string): ShimResponseBody {
  if (pathname.startsWith("/api/safe-mode")) return SAFE_MODE_PAYLOAD;
  if (pathname.startsWith("/api/dashboard/stats")) return EMPTY_STATS;
  if (pathname.startsWith("/api/sheets/")) return EMPTY_ROWS;
  if (pathname.startsWith("/api/explore")) return EMPTY_ROWS;
  if (pathname.startsWith("/api/post/")) return { post: null };
  if (pathname.startsWith("/api/import/jobs")) return { jobs: [] };
  if (pathname.startsWith("/api/analyze/status")) return { running: false };
  // Default — permissive empty envelope.
  return EMPTY_DATA;
}

function makeJsonResponse(body: ShimResponseBody, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function installStaticApiShim(): void {
  // Avoid double-install if hot-reload runs this twice.
  if ((window as unknown as { __socialListeningShim?: boolean }).__socialListeningShim) return;
  (window as unknown as { __socialListeningShim?: boolean }).__socialListeningShim = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    let url: string;
    if (typeof input === "string") url = input;
    else if (input instanceof URL) url = input.toString();
    else url = input.url;

    // Only intercept same-origin /api/* calls. Absolute URLs (e.g. to
    // Supabase / Apify) and other paths go through untouched.
    try {
      const parsed = new URL(url, window.location.origin);
      const sameOrigin = parsed.origin === window.location.origin;
      if (sameOrigin && parsed.pathname.startsWith("/api/")) {
        const method = (init?.method || "GET").toUpperCase();
        // Write operations (admin uploads, imports) can't be honoured in
        // static mode — return 503 so the UI surfaces an explicit error.
        if (method !== "GET" && method !== "HEAD") {
          return Promise.resolve(
            makeJsonResponse(
              {
                error: "static_mode",
                message:
                  "هذه العملية تتطلب خادم Social Listening النشط — غير متاح في النشر الثابت.",
              },
              503,
            ),
          );
        }
        return Promise.resolve(makeJsonResponse(matchRoute(parsed.pathname)));
      }
    } catch {
      // URL parsing failed — fall through to real fetch.
    }

    return originalFetch(input, init);
  };
}
