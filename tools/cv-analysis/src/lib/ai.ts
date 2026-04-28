"use client";

import { CVAnalysisResult, VideoAnalysisResult } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.5-pro-preview";

function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_OPENROUTER_API_KEY غير مُعرّف — أضف المفتاح في إعدادات Vercel"
    );
  }
  return key;
}

const CV_SYSTEM_PROMPT = `أنت محلل موارد بشرية متخصص في تقييم السير الذاتية تعمل في شركة ثمانية الإعلامية — واحدة من أبرز شركات الإعلام والمحتوى في المنطقة العربية.

ستحلّل صور صفحات السيرة الذاتية المرفقة (كل صورة هي صفحة واحدة من ملف PDF) بناءً على وصف الدور الذي يقدمه المستخدم.

## معايير التقييم (المجموع 100 نقطة):

### 1. المهارات التقنية والمعرفية (25 نقطة)
- مدى تطابق المهارات مع المطلوب، عمق الخبرة، التنوع.

### 2. الخبرة المهنية (25 نقطة)
- مدة ونوع الخبرة، تدرج المسار، حجم المؤسسات السابقة، الإنجازات الملموسة.

### 3. التعليم والشهادات (15 نقطة)
- ملاءمة التخصص، المؤسسة التعليمية، الشهادات المهنية، التعلم المستمر.

### 4. التوافق مع ثقافة ثمانية (20 نقطة)
- الإعلام الرقمي، الإبداع، القيادة، الملاءمة لبيئة سريعة النمو.

### 5. جودة السيرة الذاتية (15 نقطة)
- التنظيم، الوضوح، الاحترافية، غياب الفجوات غير المفسرة.

## تعليمات:
- اقرأ كل الصفحات بدقة واستشهد بمعلومات فعلية.
- إذا كان الوصف الذي قدمه المستخدم مختصراً، استنتج المتطلبات منطقياً.
- كن صريحاً — إذا كان المرشح ضعيفاً، أشر لذلك بوضوح.
- اقترح أسئلة مقابلة ذكية بناءً على نقاط الاستفسار في السيرة.

أجب بتنسيق JSON فقط بهذه الهيكلة:
{
  "overallScore": <0-100>,
  "scoreLabel": "<مرشح استثنائي / مرشح قوي / مرشح محتمل / مرشح ضعيف / غير مناسب>",
  "summary": "<ملخص تنفيذي في 3-4 جمل>",
  "dimensions": [
    {"name": "المهارات التقنية", "nameEn": "Technical Skills", "score": <0-25>, "maxScore": 25, "detail": "<تحليل>", "icon": "code"},
    {"name": "الخبرة المهنية", "nameEn": "Experience", "score": <0-25>, "maxScore": 25, "detail": "<تحليل>", "icon": "briefcase"},
    {"name": "التعليم والشهادات", "nameEn": "Education", "score": <0-15>, "maxScore": 15, "detail": "<تحليل>", "icon": "graduation-cap"},
    {"name": "التوافق الثقافي", "nameEn": "Cultural Fit", "score": <0-20>, "maxScore": 20, "detail": "<تحليل>", "icon": "heart"},
    {"name": "جودة السيرة الذاتية", "nameEn": "CV Quality", "score": <0-15>, "maxScore": 15, "detail": "<تحليل>", "icon": "file-text"}
  ],
  "strengths": ["..."],
  "concerns": ["..."],
  "experienceHighlights": ["..."],
  "educationSummary": "...",
  "skillsMatch": "...",
  "recommendation": "...",
  "suggestedQuestions": ["..."]
}`;

const VIDEO_SYSTEM_PROMPT = `أنت محلل موارد بشرية متخصص في تقييم مقاطع الفيديو التعريفية للمرشحين تعمل في شركة ثمانية الإعلامية.

ستحلّل مقطع فيديو تعريفي للمرشح بناءً على وصف الدور الذي يقدمه المستخدم، وتقيّم:
- مهارات التواصل (وضوح الأفكار، تنظيم الحديث).
- الثقة بالنفس (ثبات الصوت، التواصل البصري، الراحة).
- الوضوح والتنظيم (هيكلة العرض، الإيجاز، الترابط).
- الاحترافية (المظهر، الإعداد، الخلفية، الإضاءة).

أجب بتنسيق JSON فقط:
{
  "communicationScore": <0-100>,
  "confidenceScore": <0-100>,
  "clarityScore": <0-100>,
  "professionalismScore": <0-100>,
  "overallVideoScore": <0-100>,
  "summary": "...",
  "strengths": ["..."],
  "concerns": ["..."],
  "bodyLanguageNotes": "...",
  "communicationStyle": "...",
  "keyMoments": ["..."]
}`;

interface CVImageInput {
  base64: string;
  mimeType: string;
}

async function callOpenRouter(
  systemPrompt: string,
  userText: string,
  mediaItems: { url: string }[],
  signal?: AbortSignal
): Promise<string> {
  const apiKey = getApiKey();

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: userText },
        ...mediaItems.map((m) => ({ type: "image_url", image_url: { url: m.url } })),
      ],
    },
  ];

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer":
        typeof window !== "undefined" ? window.location.origin : "https://thmanyah.com",
      "X-Title": "Thmanyah CV Analysis",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 6000,
    }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const map: Record<number, string> = {
      400: "طلب غير صالح",
      401: "مفتاح API غير صالح",
      402: "رصيد غير كافٍ في OpenRouter",
      429: "تجاوزت حد الطلبات — حاول لاحقاً",
      500: "خطأ داخلي في خدمة التحليل",
    };
    throw new Error(map[response.status] || `فشل التحليل (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  if (data.error) {
    const msg = typeof data.error === "object" ? data.error.message : String(data.error);
    throw new Error(`خطأ من OpenRouter: ${msg}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("لم نستلم ردًا من خدمة التحليل");
  return content;
}

function extractJson<T = unknown>(content: string): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    const code = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (code?.[1]) return JSON.parse(code[1].trim()) as T;
    const brace = content.match(/\{[\s\S]*\}/);
    if (brace) return JSON.parse(brace[0]) as T;
    throw new Error("فشل في تحليل الرد — لم نجد JSON صالح");
  }
}

export async function analyzeCV(
  images: CVImageInput[],
  description: string,
  signal?: AbortSignal
): Promise<CVAnalysisResult> {
  if (images.length === 0) throw new Error("لا توجد صفحات لتحليلها");

  const userText = `## وصف الدور والأهداف
${description.trim()}

---
المرفق: ${images.length} صفحة من السيرة الذاتية. حلّل الصفحات جميعها وأعطِ تقييمك بتنسيق JSON فقط.`;

  const mediaItems = images.map((img) => ({
    url: `data:${img.mimeType};base64,${img.base64}`,
  }));

  const content = await callOpenRouter(CV_SYSTEM_PROMPT, userText, mediaItems, signal);
  const raw = extractJson<Record<string, unknown>>(content);

  return {
    overallScore: typeof raw.overallScore === "number" ? Math.min(100, Math.max(0, raw.overallScore)) : 50,
    scoreLabel: typeof raw.scoreLabel === "string" ? raw.scoreLabel : "غير محدد",
    summary: typeof raw.summary === "string" ? raw.summary : "",
    dimensions: Array.isArray(raw.dimensions)
      ? (raw.dimensions as Record<string, unknown>[]).map((d) => ({
          name: String(d.name || ""),
          nameEn: String(d.nameEn || ""),
          score: typeof d.score === "number" ? d.score : 0,
          maxScore: typeof d.maxScore === "number" ? d.maxScore : 25,
          detail: String(d.detail || ""),
          icon: String(d.icon || "circle"),
        }))
      : [],
    strengths: Array.isArray(raw.strengths) ? (raw.strengths as unknown[]).filter((s): s is string => typeof s === "string") : [],
    concerns: Array.isArray(raw.concerns) ? (raw.concerns as unknown[]).filter((s): s is string => typeof s === "string") : [],
    experienceHighlights: Array.isArray(raw.experienceHighlights) ? (raw.experienceHighlights as unknown[]).filter((s): s is string => typeof s === "string") : [],
    educationSummary: typeof raw.educationSummary === "string" ? raw.educationSummary : "",
    skillsMatch: typeof raw.skillsMatch === "string" ? raw.skillsMatch : "",
    recommendation: typeof raw.recommendation === "string" ? raw.recommendation : "",
    suggestedQuestions: Array.isArray(raw.suggestedQuestions) ? (raw.suggestedQuestions as unknown[]).filter((s): s is string => typeof s === "string") : [],
  };
}

export async function analyzeVideo(
  videoBase64: string,
  videoMimeType: string,
  description: string,
  signal?: AbortSignal
): Promise<VideoAnalysisResult> {
  const userText = `## وصف الدور والأهداف
${description.trim()}

---
المرفق: مقطع الفيديو التعريفي للمرشح. قيّمه وفق المعايير وأعطِ ردك بتنسيق JSON فقط.`;

  const mediaItems = [{ url: `data:${videoMimeType};base64,${videoBase64}` }];

  const content = await callOpenRouter(VIDEO_SYSTEM_PROMPT, userText, mediaItems, signal);
  const raw = extractJson<Record<string, unknown>>(content);
  const clamp = (v: unknown) => (typeof v === "number" ? Math.min(100, Math.max(0, v)) : 50);

  return {
    communicationScore: clamp(raw.communicationScore),
    confidenceScore: clamp(raw.confidenceScore),
    clarityScore: clamp(raw.clarityScore),
    professionalismScore: clamp(raw.professionalismScore),
    overallVideoScore: clamp(raw.overallVideoScore),
    summary: typeof raw.summary === "string" ? raw.summary : "",
    strengths: Array.isArray(raw.strengths) ? (raw.strengths as unknown[]).filter((s): s is string => typeof s === "string") : [],
    concerns: Array.isArray(raw.concerns) ? (raw.concerns as unknown[]).filter((s): s is string => typeof s === "string") : [],
    bodyLanguageNotes: typeof raw.bodyLanguageNotes === "string" ? raw.bodyLanguageNotes : "",
    communicationStyle: typeof raw.communicationStyle === "string" ? raw.communicationStyle : "",
    keyMoments: Array.isArray(raw.keyMoments) ? (raw.keyMoments as unknown[]).filter((s): s is string => typeof s === "string") : [],
  };
}
