import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: NextRequest) {
  const podcastId = request.nextUrl.searchParams.get('podcastId');
  const metrics = store.getEffectiveMetrics(podcastId || undefined);
  return NextResponse.json({ metrics });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { podcastId, ...metricsUpdate } = body;

  if (podcastId) {
    const current = store.getEffectiveMetrics(podcastId);
    store.setPodcastMetrics(podcastId, { ...current, ...metricsUpdate });
    return NextResponse.json({ success: true, metrics: store.getEffectiveMetrics(podcastId) });
  }

  store.updateMetrics(metricsUpdate);
  return NextResponse.json({ success: true, metrics: store.getMetrics() });
}
