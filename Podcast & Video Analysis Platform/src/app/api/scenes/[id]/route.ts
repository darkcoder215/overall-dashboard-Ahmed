import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const scenes = store.getScenes(params.id);

  // Build metadata map for all scenes
  const metadata: Record<string, object> = {};
  for (const scene of scenes) {
    const meta = store.getSceneMetadata(scene.id);
    if (meta) {
      metadata[scene.id] = meta;
    }
  }

  // Get podcast-level data
  const podcastData = store.getPodcastData(params.id);

  return NextResponse.json({ scenes, metadata, podcastData });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { scenes } = body;
  if (scenes) {
    store.setScenes(params.id, scenes);
  }
  return NextResponse.json({ success: true });
}
