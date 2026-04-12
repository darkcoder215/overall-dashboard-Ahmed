import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { enrichSceneMetadata, enrichPodcastMetadata } from '@/lib/ai';
import { embedAllScenes } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { podcastId } = body;

  if (!podcastId) {
    return NextResponse.json({ error: 'معرّف البودكاست مطلوب' }, { status: 400 });
  }

  const scenes = store.getScenes(podcastId);
  if (scenes.length === 0) {
    return NextResponse.json({ error: 'لا توجد مشاهد لهذا البودكاست' }, { status: 404 });
  }

  try {
    // Enrich scene metadata in batches
    const BATCH_SIZE = 3;
    for (let i = 0; i < scenes.length; i += BATCH_SIZE) {
      const batch = scenes.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (scene) => {
          try {
            const result = await enrichSceneMetadata(scene.content, scene.title);
            const meta = JSON.parse(result.content);
            store.setSceneMetadata(scene.id, meta);
          } catch {
            // Non-fatal
          }
        })
      );
      if (i + BATCH_SIZE < scenes.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Podcast-level metadata
    const podcastMeta = await enrichPodcastMetadata(scenes.map(s => s.summary));
    const parsedMeta = JSON.parse(podcastMeta.content);
    store.setPodcastData(podcastId, {
      ...store.getPodcastData(podcastId),
      mainThemes: parsedMeta.mainThemes,
      keyTakeaways: parsedMeta.keyTakeaways,
      enrichedDescription: parsedMeta.enrichedDescription,
    });

    // Re-generate embeddings
    await embedAllScenes(podcastId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطأ غير متوقع';
    return NextResponse.json(
      { error: `حدث خطأ أثناء الإثراء: ${message}` },
      { status: 500 }
    );
  }
}
