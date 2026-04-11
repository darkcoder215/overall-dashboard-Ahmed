import { Scene, SceneMetrics, PipelineStatus } from '@/types';
import { store, defaultMetrics } from './store';
import { transcribeMedia, segmentWithMetrics, enrichSceneMetadata, enrichPodcastMetadata } from './ai';
import { embedAllScenes } from './embeddings';

interface PipelineInput {
  transcript?: string;
  videoUrl?: string;
  file?: { base64: string; mimeType: string };
}

function updateStatus(podcastId: string, status: PipelineStatus) {
  store.setPipelineStatus(podcastId, status);
}

export async function runPipeline(
  podcastId: string,
  input: PipelineInput,
  metrics?: SceneMetrics
): Promise<void> {
  try {
    // ── Step 1: Transcribe ──
    let transcript: string;

    if (input.transcript) {
      transcript = input.transcript;
      updateStatus(podcastId, {
        stage: 'transcribing',
        progress: 20,
        message: 'تم استلام النص...',
      });
    } else if (input.videoUrl || input.file) {
      updateStatus(podcastId, {
        stage: 'transcribing',
        progress: 5,
        message: 'جارٍ النسخ التلقائي...',
      });

      const source = input.file || input.videoUrl!;
      const result = await transcribeMedia(source);
      const parsed = JSON.parse(result.content);
      transcript = parsed.fullTranscript;

      if (parsed.estimatedDuration) {
        store.updatePodcast(podcastId, { duration: parsed.estimatedDuration });
      }

      updateStatus(podcastId, {
        stage: 'transcribing',
        progress: 25,
        message: 'اكتمل النسخ التلقائي',
      });
    } else {
      throw new Error('لم يتم توفير مدخلات صالحة');
    }

    // Store the raw transcript
    store.setPodcastData(podcastId, {
      rawTranscript: transcript,
      videoUrl: input.videoUrl,
    });

    // ── Step 2: Segment ──
    updateStatus(podcastId, {
      stage: 'segmenting',
      progress: 30,
      message: 'جارٍ تقسيم المشاهد...',
    });

    const effectiveMetrics = metrics || store.getEffectiveMetrics(podcastId) || defaultMetrics;
    if (metrics) {
      store.setPodcastMetrics(podcastId, metrics);
    }

    const segResult = await segmentWithMetrics(transcript, effectiveMetrics);
    const parsed = JSON.parse(segResult.content);
    const scenes: Scene[] = (parsed.scenes || []).map(
      (s: { title: string; start: string; end: string; summary: string; topics: string[]; mood: string }, i: number) => ({
        id: `${podcastId}-s${i + 1}`,
        podcastId,
        title: s.title,
        startTime: s.start,
        endTime: s.end,
        content: s.summary, // Content comes from transcript segments; use summary as fallback
        summary: s.summary,
        topics: s.topics || [],
        mood: s.mood || '',
        order: i + 1,
      })
    );

    // Assign transcript content to scenes based on order
    assignTranscriptToScenes(scenes, transcript);

    store.setScenes(podcastId, scenes);
    store.updatePodcast(podcastId, { scenesCount: scenes.length });

    updateStatus(podcastId, {
      stage: 'segmenting',
      progress: 50,
      message: `تم تقسيم ${scenes.length} مشهد`,
    });

    // ── Step 3: Enrich metadata ──
    updateStatus(podcastId, {
      stage: 'enriching',
      progress: 55,
      message: 'جارٍ إثراء البيانات الوصفية...',
    });

    const BATCH_SIZE = 3;
    for (let i = 0; i < scenes.length; i += BATCH_SIZE) {
      const batch = scenes.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (scene) => {
          try {
            const metaResult = await enrichSceneMetadata(scene.content, scene.title);
            const meta = JSON.parse(metaResult.content);
            store.setSceneMetadata(scene.id, meta);
          } catch {
            // Non-fatal: scene just won't have rich metadata
          }
        })
      );
      if (i + BATCH_SIZE < scenes.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Podcast-level metadata
    try {
      const podcastMeta = await enrichPodcastMetadata(scenes.map(s => s.summary));
      const parsedMeta = JSON.parse(podcastMeta.content);
      store.setPodcastData(podcastId, {
        ...store.getPodcastData(podcastId),
        mainThemes: parsedMeta.mainThemes,
        keyTakeaways: parsedMeta.keyTakeaways,
        enrichedDescription: parsedMeta.enrichedDescription,
      });
      if (parsedMeta.enrichedDescription) {
        store.updatePodcast(podcastId, { description: parsedMeta.enrichedDescription });
      }
    } catch {
      // Non-fatal
    }

    updateStatus(podcastId, {
      stage: 'enriching',
      progress: 75,
      message: 'اكتمل إثراء البيانات',
    });

    // ── Step 4: Generate embeddings ──
    updateStatus(podcastId, {
      stage: 'embedding',
      progress: 80,
      message: 'جارٍ إنشاء فهرس البحث الذكي...',
    });

    try {
      await embedAllScenes(podcastId);
    } catch {
      // Non-fatal: search will fall back to keyword mode
    }

    updateStatus(podcastId, {
      stage: 'embedding',
      progress: 95,
      message: 'اكتمل الفهرسة',
    });

    // ── Step 5: Complete ──
    store.updatePodcast(podcastId, { status: 'ready' });
    updateStatus(podcastId, {
      stage: 'complete',
      progress: 100,
      message: 'اكتمل التحليل بنجاح!',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    store.updatePodcast(podcastId, { status: 'error' });
    updateStatus(podcastId, {
      stage: 'error',
      progress: 0,
      message: 'فشل التحليل',
      error: message,
    });
  }
}

// Distribute transcript text across scenes proportionally
function assignTranscriptToScenes(scenes: Scene[], transcript: string): void {
  if (scenes.length === 0 || !transcript) return;

  const words = transcript.split(/\s+/);
  const wordsPerScene = Math.ceil(words.length / scenes.length);

  for (let i = 0; i < scenes.length; i++) {
    const start = i * wordsPerScene;
    const end = Math.min(start + wordsPerScene, words.length);
    const sceneText = words.slice(start, end).join(' ');
    if (sceneText) {
      scenes[i].content = sceneText;
    }
  }
}

// Re-segment an existing podcast with new metrics
export async function resegmentPodcast(
  podcastId: string,
  metrics: SceneMetrics
): Promise<Scene[]> {
  const podcastData = store.getPodcastData(podcastId);
  let transcript = podcastData?.rawTranscript;

  // Fallback: concatenate existing scene content
  if (!transcript) {
    const existingScenes = store.getScenes(podcastId);
    transcript = existingScenes.map(s => s.content).join('\n\n');
  }

  if (!transcript) {
    throw new Error('لا يوجد نص متاح لإعادة التقسيم');
  }

  store.setPodcastMetrics(podcastId, metrics);

  const segResult = await segmentWithMetrics(transcript, metrics);
  const parsed = JSON.parse(segResult.content);
  const scenes: Scene[] = (parsed.scenes || []).map(
    (s: { title: string; start: string; end: string; summary: string; topics: string[]; mood: string }, i: number) => ({
      id: `${podcastId}-s${Date.now()}-${i + 1}`,
      podcastId,
      title: s.title,
      startTime: s.start,
      endTime: s.end,
      content: s.summary,
      summary: s.summary,
      topics: s.topics || [],
      mood: s.mood || '',
      order: i + 1,
    })
  );

  assignTranscriptToScenes(scenes, transcript);
  store.setScenes(podcastId, scenes);
  store.updatePodcast(podcastId, { scenesCount: scenes.length });

  return scenes;
}
