import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { runPipeline } from '@/lib/pipeline';
import type { Podcast } from '@/types';

export async function GET() {
  const podcasts = store.getPodcasts();
  return NextResponse.json({ podcasts });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, mode, transcript, videoUrl } = body;

  const id = `podcast-${Date.now()}`;
  const podcast: Podcast = {
    id,
    title: title || 'بودكاست جديد',
    description: transcript
      ? transcript.slice(0, 150) + '...'
      : 'جارٍ تحليل البودكاست...',
    duration: '00:00',
    uploadDate: new Date().toISOString().split('T')[0],
    status: 'processing',
    scenesCount: 0,
    source: mode === 'transcript' ? 'transcript' : mode === 'video-url' ? 'video-url' : 'upload',
  };

  store.addPodcast(podcast);

  // Fire-and-forget: run the full AI pipeline in the background
  runPipeline(id, {
    transcript: transcript || undefined,
    videoUrl: videoUrl || undefined,
  }).catch(() => {
    // Pipeline handles its own error status
  });

  return NextResponse.json({ id, podcast });
}
