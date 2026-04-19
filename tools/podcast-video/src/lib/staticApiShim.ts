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
import { supabase, isSupabaseConfigured } from './supabase';
import type { Podcast, Scene, SearchResult } from '@/types';

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

// ── Helpers for the static upload path ──
//
// In dev mode `/api/podcasts POST` runs the full AI pipeline on the
// server (transcribe → segment → enrich → embed). Under static export
// we don't have a server, so we accept the upload, segment the
// transcript deterministically, and persist everything to the
// `podcast_video` schema so refreshing the page still shows it.

function formatTime(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function estimateDuration(transcript: string): string {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  // Arabic podcast speech ≈ 2 words / sec (rough).
  return formatTime(Math.max(30, Math.round(words / 2)));
}

function segmentFallback(podcastId: string, transcript: string): Scene[] {
  const clean = transcript.trim();
  if (!clean) return [];

  // Prefer user-provided paragraph breaks; otherwise chunk ~150 words.
  const paragraphs = clean.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  let chunks: string[];
  if (paragraphs.length >= 2) {
    chunks = paragraphs;
  } else {
    const words = clean.split(/\s+/);
    chunks = [];
    const chunkSize = 150;
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    if (chunks.length === 0) chunks = [clean];
  }

  let cursor = 0;
  return chunks.map((content, i) => {
    const words = content.split(/\s+/).length;
    const secs = Math.max(30, Math.min(300, Math.round(words / 2)));
    const start = cursor;
    const end = cursor + secs;
    cursor = end;
    const snippet = content.replace(/\s+/g, ' ').trim();
    const titleBase = snippet.slice(0, 50).replace(/\s+\S*$/, '');
    return {
      id: `${podcastId}-s${i + 1}`,
      podcastId,
      title: `${titleBase}${snippet.length > 50 ? '…' : ''}`.trim() || `المشهد ${i + 1}`,
      startTime: formatTime(start),
      endTime: formatTime(end),
      content,
      summary: snippet.slice(0, 140) + (snippet.length > 140 ? '…' : ''),
      topics: [],
      mood: '',
      order: i + 1,
    };
  });
}

type UploadBody = {
  title?: string;
  mode?: 'upload' | 'transcript' | 'video-url';
  transcript?: string;
  videoUrl?: string;
};

async function persistToSupabase(
  podcast: Podcast,
  scenes: Scene[],
  transcript: string,
  videoUrl: string | undefined,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }
  try {
    const { error: podcastErr } = await supabase
      .schema('podcast_video')
      .from('podcasts')
      .insert({
        id: podcast.id,
        title: podcast.title,
        description: podcast.description,
        duration: podcast.duration,
        upload_date: podcast.uploadDate,
        status: podcast.status,
        scenes_count: podcast.scenesCount,
        source: podcast.source,
        raw_transcript: transcript,
        video_url: videoUrl || null,
        pipeline_status: { stage: 'complete', progress: 100, message: 'مكتمل' },
      });
    if (podcastErr) throw podcastErr;

    if (scenes.length > 0) {
      const { error: scenesErr } = await supabase
        .schema('podcast_video')
        .from('scenes')
        .insert(
          scenes.map((s) => ({
            id: s.id,
            podcast_id: podcast.id,
            title: s.title,
            start_time: s.startTime,
            end_time: s.endTime,
            content: s.content,
            summary: s.summary || '',
            topics: s.topics || [],
            mood: s.mood || '',
            order: s.order || 0,
          })),
        );
      if (scenesErr) throw scenesErr;
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** /api/podcasts GET + POST */
const podcastsList: Handler = async (req) => {
  if (req.method === 'GET') {
    return ok({ podcasts: store.getPodcasts() });
  }
  if (req.method !== 'POST') {
    return err('Method not allowed', 405);
  }

  let body: UploadBody;
  try {
    body = (await req.json()) as UploadBody;
  } catch {
    return err('Invalid JSON body', 400);
  }

  const title = (body.title || '').trim();
  if (!title) return err('الرجاء إدخال عنوان البودكاست', 400);

  const mode = body.mode || 'transcript';
  const transcript = (body.transcript || '').trim();
  const videoUrl = (body.videoUrl || '').trim();

  // The three modes map onto the DB `source` check constraint. File
  // uploads arrive after the caller has already transcribed the audio
  // via /api/analyze, so at this point we always have text — or a URL
  // placeholder for the video-url flow without AI.
  const source: Podcast['source'] =
    mode === 'video-url' ? 'video-url' : mode === 'transcript' ? 'transcript' : 'upload';

  const effectiveTranscript =
    transcript ||
    (videoUrl
      ? `تم تسجيل رابط الفيديو: ${videoUrl}. فعّل الذكاء الاصطناعي لتحليله تلقائياً.`
      : 'لا يوجد نص. فعّل الذكاء الاصطناعي لتحليل الملف المرفوع.');

  const id = `pod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const uploadDate = new Date().toISOString().slice(0, 10);
  const scenes = segmentFallback(id, effectiveTranscript);

  const podcast: Podcast = {
    id,
    title,
    description:
      effectiveTranscript.replace(/\s+/g, ' ').slice(0, 200) +
      (effectiveTranscript.length > 200 ? '…' : ''),
    duration: estimateDuration(effectiveTranscript),
    uploadDate,
    status: 'ready',
    scenesCount: scenes.length,
    source,
  };

  // 1 · in-memory — the user's current tab sees the row immediately.
  store.addPodcast(podcast);
  store.setScenes(id, scenes);
  store.setPodcastData(id, {
    rawTranscript: effectiveTranscript,
    videoUrl: videoUrl || undefined,
  });
  store.setPipelineStatus(id, { stage: 'complete', progress: 100, message: 'مكتمل' });

  // 2 · Supabase — so refreshing or opening from another tab still shows it.
  const persistResult = await persistToSupabase(podcast, scenes, effectiveTranscript, videoUrl);
  if (!persistResult.ok) {
    // eslint-disable-next-line no-console
    console.warn('[staticApiShim] podcast persist failed:', persistResult.error);
  }

  return ok({
    id,
    podcast,
    persisted: persistResult.ok,
    persistError: persistResult.error,
  });
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
      if (body?.scenes) {
        store.setScenes(id, body.scenes);
        // Best-effort sync to Supabase — replace all scenes for this
        // podcast. Silent fallback if the DB is unreachable.
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.schema('podcast_video').from('scenes').delete().eq('podcast_id', id);
            if (body.scenes.length > 0) {
              await supabase
                .schema('podcast_video')
                .from('scenes')
                .insert(
                  (body.scenes as Scene[]).map((s) => ({
                    id: s.id,
                    podcast_id: id,
                    title: s.title,
                    start_time: s.startTime,
                    end_time: s.endTime,
                    content: s.content,
                    summary: s.summary || '',
                    topics: s.topics || [],
                    mood: s.mood || '',
                    order: s.order || 0,
                  })),
                );
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[staticApiShim] scene sync failed:', e);
          }
        }
      }
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
