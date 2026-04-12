import { NextResponse } from 'next/server';
import { getAIConfig, validateApiKey } from '@/lib/ai';

export async function GET() {
  const config = getAIConfig();

  if (!config.isConfigured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      model: null,
      error: 'مفتاح API غير مُعدّ. أضف المفتاح في ملف .env.local',
    });
  }

  const validation = await validateApiKey();

  return NextResponse.json({
    configured: true,
    connected: validation.valid,
    model: 'Gemini 2.5 Flash',
    videoSupport: true,
    structuredOutput: true,
    error: validation.error || null,
  });
}
