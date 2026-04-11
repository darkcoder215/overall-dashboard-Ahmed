import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const status = store.getPipelineStatus(id);

  if (!status) {
    // If no pipeline status, check if the podcast exists and is ready
    const podcast = store.getPodcast(id);
    if (podcast?.status === 'ready') {
      return NextResponse.json({
        stage: 'complete',
        progress: 100,
        message: 'مكتمل',
      });
    }
    if (podcast?.status === 'processing') {
      return NextResponse.json({
        stage: 'transcribing',
        progress: 5,
        message: 'جارٍ التحليل...',
      });
    }
    return NextResponse.json(
      { error: 'البودكاست غير موجود' },
      { status: 404 }
    );
  }

  return NextResponse.json(status);
}
