/**
 * Static-export API shim.
 *
 * When the tool is built with `next build` + `output: "export"`, the
 * `src/app/api/*` route handlers are stripped (see `build.sh`'s
 * `HIDE_APP_API=1` flag). To keep the client working, we monkey-patch
 * `window.fetch` to intercept `/api/...` requests and serve them from
 * the client-side in-memory `store`.
 *
 * The shim is installed only when `NEXT_PUBLIC_STATIC_EXPORT === '1'`
 * (set by the unified build). Under `next dev` the shim is a no-op and
 * the real route handlers run on the server.
 */

import { store } from './store';
import type { SearchResult } from '@/types';

type Handler = (
  req: Request,
  params?: Record<string, string>,
  query?: URLSearchParams,
) => Promise<Response> | Response;

function ok(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

function err(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** /api/ai-status — AI integration disabled in the static build */
const aiStatus: Handler = () =>
  ok({
    configured: false,
    connected: false,
    model: null,
    videoSupport: false,
    structuredOutput: false,
    error: 'خدمات الذكاء الاصطناعي غير مفعّلة في هذا النشر الثابت.',
  });

/** /api/podcasts GET + POST */
const podcastsList: Handler = async (req) => {
  if (req.method === 'GET') {
    return ok({ podcasts: store.getPodcasts() });
  }
  if (req.method === 'POST') {
    return err(
      'رفع بودكاست جديد غير مفعّل في هذا النشر. شغّل الأداة محلياً عبر npm run dev.',
      503,
    );
  }
  return err('Method not allowed', 405);
};

/** /api/podcasts/[id] GET */
const podcastDetail: Handler = (_req, params) => {
  const id = params?.id;
  if (!id) return err('Missing id', 400);
  const podcast = store.getPodcast(id);
  if (!podcast) return err('البودكاست غير موجود', 404);
  return ok({ podcast });
};

/** /api/scenes/[id] GET + PUT */
const scenesDetail: Handler = async (req, params) => {
  const id = params?.id;
  if (!id) return err('Missing id', 400);

  if (req.method === 'GET') {
    const scenes = store.getScenes(id);
    const metadata: Record<string, object> = {};
    for (const scene of scenes) {
      const meta = store.getSceneMetadata(scene.id);
      if (meta) metadata[scene.id] = meta;
    }
    const podcastData = store.getPodcastData(id);
    return ok({ scenes, metadata, podcastData });
  }

  if (req.method === 'PUT') {
    try {
      const body = await req.json();
      if (body?.scenes) store.setScenes(id, body.scenes);
      return ok({ success: true });
    } catch {
      return err('Invalid JSON body', 400);
    }
  }

  return err('Method not allowed', 405);
};

/** /api/metrics GET + PUT */
const metrics: Handler = async (req, _params, query) => {
  if (req.method === 'GET') {
    const podcastId = query?.get('podcastId') || undefined;
    return ok({ metrics: store.getEffectiveMetrics(podcastId) });
  }
  if (req.method === 'PUT') {
    try {
      const body = await req.json();
      const { podcastId, ...metricsUpdate } = body;
      if (podcastId) {
        const current = store.getEffectiveMetrics(podcastId);
        store.setPodcastMetrics(podcastId, { ...current, ...metricsUpdate });
        return ok({ success: true, metrics: store.getEffectiveMetrics(podcastId) });
      }
      store.updateMetrics(metricsUpdate);
      return ok({ success: true, metrics: store.getEffectiveMetrics() });
    } catch {
      return err('Invalid JSON body', 400);
    }
  }
  return err('Method not allowed', 405);
};

/** /api/search?q=... */
const search: Handler = (_req, _params, query) => {
  const q = query?.get('q') || '';
  if (!q.trim()) return ok({ results: [], mode: 'none' });
  const results: SearchResult[] = store.searchContent(q);
  return ok({ results, mode: 'keyword' });
};

/** /api/pipeline-status/[id] */
const pipelineStatus: Handler = (_req, params) => {
  const id = params?.id;
  if (!id) return err('Missing id', 400);

  const status = store.getPipelineStatus(id);
  if (status) return ok(status);

  const podcast = store.getPodcast(id);
  if (podcast?.status === 'ready') {
    return ok({ stage: 'complete', progress: 100, message: 'مكتمل' });
  }
  if (podcast?.status === 'processing') {
    return ok({ stage: 'transcribing', progress: 5, message: 'جارٍ التحليل...' });
  }
  return err('البودكاست غير موجود', 404);
};

/** /api/analyze, /api/enrich, /api/chat — AI is disabled in static builds */
const aiDisabled: Handler = () =>
  err(
    'خدمات الذكاء الاصطناعي غير مفعّلة في هذا النشر الثابت. شغّل الأداة محلياً لاستخدام OpenRouter.',
    503,
  );

interface RouteSpec {
  test: (pathname: string) => { params?: Record<string, string> } | null;
  handler: Handler;
}

function literal(pathname: string): RouteSpec['test'] {
  return (p) => (p === pathname ? {} : null);
}

function withId(prefix: string, suffix = ''): RouteSpec['test'] {
  const re = new RegExp(`^${prefix}/([^/]+)${suffix}$`);
  return (p) => {
    const m = p.match(re);
    return m ? { params: { id: m[1] } } : null;
  };
}

const routes: RouteSpec[] = [
  { test: literal('/api/ai-status'), handler: aiStatus },
  { test: literal('/api/podcasts'), handler: podcastsList },
  { test: withId('/api/podcasts'), handler: podcastDetail },
  { test: withId('/api/scenes'), handler: scenesDetail },
  { test: withId('/api/pipeline-status'), handler: pipelineStatus },
  { test: literal('/api/metrics'), handler: metrics },
  { test: literal('/api/search'), handler: search },
  { test: literal('/api/analyze'), handler: aiDisabled },
  { test: literal('/api/enrich'), handler: aiDisabled },
  { test: literal('/api/chat'), handler: aiDisabled },
];

function resolveUrl(input: RequestInfo | URL): URL {
  if (typeof input === 'string') {
    if (input.startsWith('/')) {
      return new URL(input, window.location.origin);
    }
    return new URL(input, window.location.href);
  }
  if (input instanceof URL) return input;
  return new URL(input.url);
}

let installed = false;

export function installStaticApiShim(): void {
  if (installed) return;
  if (typeof window === 'undefined') return;
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT !== '1') return;

  installed = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = resolveUrl(input);
      const pathname = url.pathname;

      if (!pathname.includes('/api/')) {
        return originalFetch(input as RequestInfo, init);
      }

      // Strip the basePath (e.g. /podcast-video) if the app was served
      // from a subpath. Routes are declared with the bare /api/... form.
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      let apiPath = pathname;
      if (basePath && apiPath.startsWith(basePath)) {
        apiPath = apiPath.slice(basePath.length) || '/';
      }
      if (!apiPath.startsWith('/api/')) {
        return originalFetch(input as RequestInfo, init);
      }

      for (const route of routes) {
        const match = route.test(apiPath);
        if (!match) continue;

        const method =
          (init?.method ||
            (typeof input !== 'string' && !(input instanceof URL) ? input.method : undefined) ||
            'GET').toUpperCase();

        const req = new Request(url.toString(), {
          method,
          headers: init?.headers,
          body: init?.body as BodyInit | null | undefined,
        });

        return await route.handler(req, match.params, url.searchParams);
      }

      // Unknown /api path — fall back to the real fetch (will 404 under static export)
      return originalFetch(input as RequestInfo, init);
    } catch (e) {
      console.error('[staticApiShim] handler error', e);
      return new Response(
        JSON.stringify({ error: 'shim handler failed', detail: String(e) }),
        { status: 500, headers: { 'content-type': 'application/json' } },
      );
    }
  };

  // eslint-disable-next-line no-console
  console.info('[staticApiShim] installed — /api/* routed to in-memory store');
}
