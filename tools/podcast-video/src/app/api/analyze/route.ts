import { NextRequest, NextResponse } from 'next/server';
import { analyzeTranscript, analyzeVideo, analyzeVideoStructured, transcribeMedia } from '@/lib/ai';
import { resegmentPodcast } from '@/lib/pipeline';

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  // File upload mode — multipart form data
  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'لم يتم توفير ملف' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const mimeType = file.type || 'video/mp4';

      const result = await transcribeMedia({ base64, mimeType });
      return NextResponse.json({ result: result.content, mode: 'file' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطأ غير متوقع';
      return NextResponse.json(
        { error: `حدث خطأ أثناء نسخ الملف: ${message}` },
        { status: 500 }
      );
    }
  }

  const body = await request.json();
  const { transcript, videoUrl, mode } = body;

  // Re-segment with new metrics
  if (mode === 'resegment') {
    const { podcastId, metrics } = body;
    if (!podcastId) {
      return NextResponse.json({ error: 'معرّف البودكاست مطلوب' }, { status: 400 });
    }
    try {
      const scenes = await resegmentPodcast(podcastId, metrics);
      return NextResponse.json({ scenes, mode: 'resegment' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطأ غير متوقع';
      return NextResponse.json(
        { error: `حدث خطأ أثناء إعادة التقسيم: ${message}` },
        { status: 500 }
      );
    }
  }

  // Video structured analysis mode
  if (mode === 'video' && videoUrl) {
    try {
      const result = await analyzeVideoStructured(videoUrl);
      return NextResponse.json({ result: result.content, mode: 'video' });
    } catch {
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تحليل الفيديو. تأكد من صحة الرابط.' },
        { status: 500 }
      );
    }
  }

  // Free-form video analysis
  if (mode === 'video-query' && videoUrl) {
    const { prompt } = body;
    try {
      const result = await analyzeVideo(videoUrl, prompt);
      return NextResponse.json({ result: result.content, mode: 'video-query' });
    } catch {
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تحليل الفيديو' },
        { status: 500 }
      );
    }
  }

  // Transcribe from URL
  if (mode === 'transcribe' && videoUrl) {
    try {
      const result = await transcribeMedia(videoUrl);
      return NextResponse.json({ result: result.content, mode: 'transcribe' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطأ غير متوقع';
      return NextResponse.json(
        { error: `حدث خطأ أثناء النسخ: ${message}` },
        { status: 500 }
      );
    }
  }

  // Text transcript analysis
  if (!transcript?.trim()) {
    return NextResponse.json({ error: 'الرجاء إدخال النص' }, { status: 400 });
  }

  try {
    const result = await analyzeTranscript(transcript);
    return NextResponse.json({ result: result.content, mode: 'text' });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحليل' },
      { status: 500 }
    );
  }
}

// Body size handled via next.config.js experimental.serverActions.bodySizeLimit
