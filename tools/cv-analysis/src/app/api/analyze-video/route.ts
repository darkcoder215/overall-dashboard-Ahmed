import { NextRequest, NextResponse } from "next/server";

const AI_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.5-pro-preview";
const REQUEST_TIMEOUT_MS = 180_000;

const VIDEO_ANALYSIS_SCHEMA = {
  type: "object" as const,
  properties: {
    communicationScore: { type: "number" as const },
    confidenceScore: { type: "number" as const },
    clarityScore: { type: "number" as const },
    professionalismScore: { type: "number" as const },
    overallVideoScore: { type: "number" as const },
    summary: { type: "string" as const },
    strengths: { type: "array" as const, items: { type: "string" as const } },
    concerns: { type: "array" as const, items: { type: "string" as const } },
    bodyLanguageNotes: { type: "string" as const },
    communicationStyle: { type: "string" as const },
    keyMoments: { type: "array" as const, items: { type: "string" as const } },
  },
  required: [
    "communicationScore", "confidenceScore", "clarityScore", "professionalismScore",
    "overallVideoScore", "summary", "strengths", "concerns",
    "bodyLanguageNotes", "communicationStyle", "keyMoments",
  ],
};

const SYSTEM_PROMPT = `أنت محلل موارد بشرية متخصص في تقييم مقاطع الفيديو التعريفية للمرشحين تعمل في شركة ثمانية الإعلامية.

مهمتك تحليل مقطع الفيديو المقدم من المرشح وتقييمه من عدة جوانب.

## معايير التقييم (كل معيار من 100):

### 1. مهارات التواصل (communicationScore)
- وضوح الأفكار والقدرة على الشرح
- تنظيم الحديث وتسلسل الأفكار
- استخدام اللغة بشكل سليم
- القدرة على إيصال الرسالة

### 2. الثقة بالنفس (confidenceScore)
- ثبات الصوت ونبرته
- الاتصال البصري مع الكاميرا
- الراحة في الحديث عن الذات
- غياب التردد المفرط

### 3. الوضوح والتنظيم (clarityScore)
- هيكلة العرض التقديمي
- الإيجاز دون إخلال
- ترابط النقاط المطروحة
- الانتهاء بخلاصة واضحة

### 4. الاحترافية (professionalismScore)
- المظهر العام ومناسبته
- جودة الإعداد للفيديو
- الخلفية والإضاءة
- الالتزام بالمدة المطلوبة

## تعليمات:
- قيّم كل بُعد من 0 إلى 100
- أعطِ درجة إجمالية (overallVideoScore) كمتوسط مرجح
- كن موضوعياً ومحدداً في ملاحظاتك
- أشر للحظات بارزة (إيجابية أو سلبية) في الفيديو
- صف أسلوب التواصل (رسمي/ودود/متحفظ/حماسي...)

أجب بتنسيق JSON فقط.`;

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "طلب غير صالح — تعذر قراءة البيانات" },
        { status: 400 }
      );
    }

    const { videoBase64, videoMimeType, roleContext } = body;
    if (!videoBase64 || !roleContext) {
      return NextResponse.json(
        { error: "بيانات الفيديو ومتطلبات الدور مطلوبة" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "مفتاح API غير مُعرّف" },
        { status: 500 }
      );
    }

    const rolePrompt = `## سياق الدور الوظيفي
- المسمى: ${roleContext.roleTitle}
- الإدارة: ${roleContext.department}
- المستوى: ${roleContext.experienceLevel}

## المطلوب:
حلل مقطع الفيديو التعريفي المرفق للمرشح وقيّمه وفق المعايير المحددة. أعطِ تقييمك بتنسيق JSON فقط.`;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: rolePrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${videoMimeType || "video/mp4"};base64,${videoBase64}`,
            },
          },
        ],
      },
    ];

    const payload = {
      model: MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 4000,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_analysis",
          strict: true,
          schema: VIDEO_ANALYSIS_SCHEMA,
        },
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(AI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://cv-analysis.thmanyah.com",
          "X-Title": "Thmanyah Video Analysis",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      const isAbort = fetchErr instanceof DOMException && fetchErr.name === "AbortError";
      return NextResponse.json(
        { error: isAbort ? "انتهت مهلة الاتصال" : "تعذر الاتصال بخدمة التحليل" },
        { status: 504 }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      let errorBody: string;
      try { errorBody = await response.text(); } catch { errorBody = ""; }
      console.error(`API error [${response.status}]:`, errorBody);
      return NextResponse.json(
        { error: `فشل في تحليل الفيديو (${response.status})` },
        { status: 502 }
      );
    }

    let data;
    try { data = await response.json(); } catch {
      return NextResponse.json({ error: "رد غير صالح" }, { status: 502 });
    }

    if (data.error) {
      return NextResponse.json({ error: "خطأ من خدمة التحليل" }, { status: 502 });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "لم نستلم ردًا" }, { status: 502 });
    }

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      try {
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch?.[1]) {
          analysis = JSON.parse(codeBlockMatch[1].trim());
        } else {
          const braceMatch = content.match(/\{[\s\S]*\}/);
          if (braceMatch) analysis = JSON.parse(braceMatch[0]);
          else throw new Error("No JSON found");
        }
      } catch {
        return NextResponse.json({ error: "فشل في تحليل الرد" }, { status: 500 });
      }
    }

    const clamp = (v: unknown) => typeof v === "number" ? Math.min(100, Math.max(0, v)) : 50;

    const validated = {
      communicationScore: clamp(analysis.communicationScore),
      confidenceScore: clamp(analysis.confidenceScore),
      clarityScore: clamp(analysis.clarityScore),
      professionalismScore: clamp(analysis.professionalismScore),
      overallVideoScore: clamp(analysis.overallVideoScore),
      summary: typeof analysis.summary === "string" ? analysis.summary : "",
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.filter((s: unknown) => typeof s === "string") : [],
      concerns: Array.isArray(analysis.concerns) ? analysis.concerns.filter((s: unknown) => typeof s === "string") : [],
      bodyLanguageNotes: typeof analysis.bodyLanguageNotes === "string" ? analysis.bodyLanguageNotes : "",
      communicationStyle: typeof analysis.communicationStyle === "string" ? analysis.communicationStyle : "",
      keyMoments: Array.isArray(analysis.keyMoments) ? analysis.keyMoments.filter((s: unknown) => typeof s === "string") : [],
    };

    return NextResponse.json({ analysis: validated });
  } catch (error) {
    console.error("Unhandled error:", error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
