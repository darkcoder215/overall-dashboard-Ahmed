import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const podcast = store.getPodcast(params.id);
  if (!podcast) {
    return NextResponse.json({ error: 'البودكاست غير موجود' }, { status: 404 });
  }
  return NextResponse.json({ podcast });
}
