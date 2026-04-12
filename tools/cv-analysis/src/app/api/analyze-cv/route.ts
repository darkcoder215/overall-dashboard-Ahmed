import { NextRequest, NextResponse } from "next/server";

const AI_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.5-pro-preview";
const REQUEST_TIMEOUT_MS = 120_000;

const CV_ANALYSIS_SCHEMA = {
  type: "object" as const,
  properties: {
    overallScore: { type: "number" as const, description: "Score from 0 to 100" },
    scoreLabel: { type: "string" as const },
    summary: { type: "string" as const },
    dimensions: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          name: { type: "string" as const },
          nameEn: { type: "string" as const },
          score: { type: "number" as const },
          maxScore: { type: "number" as const },
          detail: { type: "string" as const },
          icon: { type: "string" as const },
        },
        required: ["name", "nameEn", "score", "maxScore", "detail", "icon"],
      },
    },
    strengths: { type: "array" as const, items: { type: "string" as const } },
    concerns: { type: "array" as const, items: { type: "string" as const } },
    experienceHighlights: { type: "array" as const, items: { type: "string" as const } },
    educationSummary: { type: "string" as const },
    skillsMatch: { type: "string" as const },
    recommendation: { type: "string" as const },
    suggestedQuestions: { type: "array" as const, items: { type: "string" as const } },
  },
  required: [
    "overallScore", "scoreLabel", "summary", "dimensions",
    "strengths", "concerns", "experienceHighlights", "educationSummary",
    "skillsMatch", "recommendation", "suggestedQuestions",
  ],
};

const SYSTEM_PROMPT = `أنت محلل موارد بشرية متخصص في تقييم السير الذاتية تعمل في شركة ثمانية الإعلامية — واحدة من أبرز شركات الإعلام والمحتوى في المنطقة العربية.

مهمتك إجراء تحليل شامل ودقيق للسيرة الذاتية المقدمة بناءً على متطلبات الدور الوظيفي.

## معايير التقييم (المجموع 100 نقطة):

### 1. المهارات التقنية والمعرفية (25 نقطة)
- مدى تطابق المهارات المذكورة مع المطلوب
- عمق الخبرة التقنية في المجال
- التنوع والتكامل في المهارات
- وجود مهارات إضافية مميزة

### 2. الخبرة المهنية (25 نقطة)
- مدة ونوع الخبرة المتعلقة بالدور
- تدرج المسار الوظيفي ومنطقية الانتقالات
- حجم ونوع المؤسسات السابقة
- الإنجازات الملموسة والقابلة للقياس

### 3. التعليم والشهادات (15 نقطة)
- ملاءمة التخصص الأكاديمي
- مستوى المؤسسة التعليمية
- الشهادات المهنية والدورات
- التعلم المستمر

### 4. التوافق مع ثقافة ثمانية (20 نقطة)
- مؤشرات على التوافق مع بيئة إعلامية إبداعية
- الاهتمام بالمحتوى والإعلام الرقمي
- مؤشرات القيادة والمبادرة
- القدرة على العمل في بيئة سريعة النمو

### 5. جودة السيرة الذاتية (15 نقطة)
- التنظيم والوضوح
- التفاصيل والدقة
- الاحترافية في العرض
- غياب الفجوات غير المفسرة

## تعليمات:
- حلل السيرة الذاتية بدقة وموضوعية
- استشهد بمعلومات فعلية من السيرة الذاتية
- قارن بمتطلبات الدور المحددة
- كن صريحاً — إذا كان المرشح ضعيفاً أشر لذلك بوضوح
- اقترح أسئلة مقابلة ذكية بناءً على نقاط الاستفسار في السيرة

أجب بتنسيق JSON فقط بهذه الهيكلة:
{
  "overallScore": <0-100>,
  "scoreLabel": "<مرشح استثنائي / مرشح قوي / مرشح محتمل / مرشح ضعيف / غير مناسب>",
  "summary": "<ملخص تنفيذي في 3-4 جمل>",
  "dimensions": [
    {"name": "المهارات التقنية", "nameEn": "Technical Skills", "score": <0-25>, "maxScore": 25, "detail": "<تحليل مفصل>", "icon": "code"},
    {"name": "الخبرة المهنية", "nameEn": "Experience", "score": <0-25>, "maxScore": 25, "detail": "<تحليل مفصل>", "icon": "briefcase"},
    {"name": "التعليم والشهادات", "nameEn": "Education", "score": <0-15>, "maxScore": 15, "detail": "<تحليل مفصل>", "icon": "graduation-cap"},
    {"name": "التوافق الثقافي", "nameEn": "Cultural Fit", "score": <0-20>, "maxScore": 20, "detail": "<تحليل مفصل>", "icon": "heart"},
    {"name": "جودة السيرة الذاتية", "nameEn": "CV Quality", "score": <0-15>, "maxScore": 15, "detail": "<تحليل مفصل>", "icon": "file-text"}
  ],
  "strengths": ["<نقطة قوة مبنية على بيانات فعلية>"],
  "concerns": ["<ملاحظة أو تحفظ مع ذكر السبب>"],
  "experienceHighlights": ["<أبرز محطة مهنية>"],
  "educationSummary": "<ملخص التعليم والشهادات>",
  "skillsMatch": "<تحليل تطابق المهارات مع المطلوب>",
  "recommendation": "<توصية واضحة في 2-3 جمل>",
  "suggestedQuestions": ["<سؤال مقابلة ذكي بناءً على السيرة>"]
}`;

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

    const { cvBase64, cvMimeType, roleContext } = body;
    if (!cvBase64 || !roleContext) {
      return NextResponse.json(
        { error: "بيانات السيرة الذاتية ومتطلبات الدور مطلوبة" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "مفتاح API غير مُعرّف — يرجى إعداده في إعدادات البيئة" },
        { status: 500 }
      );
    }

    const rolePrompt = `## متطلبات الدور الوظيفي
| البند | القيمة |
|-------|--------|
| المسمى الوظيفي | ${roleContext.roleTitle} |
| المسمى بالإنجليزية | ${roleContext.roleTitleEn || "غير محدد"} |
| الإدارة | ${roleContext.department} |
| مستوى الخبرة المطلوب | ${roleContext.experienceLevel} |
| المهارات المطلوبة | ${roleContext.requiredSkills} |
| متطلبات اللغة | ${roleContext.languageRequirements || "غير محدد"} |

### الوصف الوظيفي:
${roleContext.roleDescription}

### مهارات مرغوبة (اختيارية):
${roleContext.niceToHaveSkills || "لم تُحدد"}

### ملاحظات إضافية:
${roleContext.additionalNotes || "لا توجد"}

---
حلل السيرة الذاتية المرفقة بناءً على المتطلبات أعلاه وأعطِ تقييمك بتنسيق JSON فقط.`;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: rolePrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${cvMimeType || "application/pdf"};base64,${cvBase64}`,
            },
          },
        ],
      },
    ];

    const payload = {
      model: MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 6000,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "cv_analysis",
          strict: true,
          schema: CV_ANALYSIS_SCHEMA,
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
          "X-Title": "Thmanyah CV Analysis",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      const isAbort = fetchErr instanceof DOMException && fetchErr.name === "AbortError";
      return NextResponse.json(
        {
          error: isAbort
            ? "انتهت مهلة الاتصال — يرجى المحاولة مرة أخرى"
            : "تعذر الاتصال بخدمة التحليل",
        },
        { status: 504 }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      let errorBody: string;
      try {
        errorBody = await response.text();
      } catch {
        errorBody = "(could not read error body)";
      }
      console.error(`API error [${response.status}]:`, errorBody);

      const statusMessages: Record<number, string> = {
        400: "طلب غير صالح",
        401: "مفتاح API غير صالح",
        402: "رصيد غير كافٍ",
        429: "تجاوزت حد الطلبات — يرجى المحاولة بعد قليل",
        500: "خطأ داخلي في خدمة التحليل",
      };

      return NextResponse.json(
        { error: statusMessages[response.status] || `فشل في التحليل (${response.status})` },
        { status: 502 }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch {
      return NextResponse.json(
        { error: "رد غير صالح من خدمة التحليل" },
        { status: 502 }
      );
    }

    if (data.error) {
      const errMsg = typeof data.error === "object" ? data.error.message || JSON.stringify(data.error) : String(data.error);
      console.error("API error in body:", errMsg);
      return NextResponse.json({ error: "خطأ من خدمة التحليل" }, { status: 502 });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "لم نستلم ردًا من خدمة التحليل" }, { status: 502 });
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
          if (braceMatch) {
            analysis = JSON.parse(braceMatch[0]);
          } else {
            throw new Error("No JSON found");
          }
        }
      } catch (innerErr) {
        console.error("JSON parsing failed:", innerErr, "\nRaw:", content.slice(0, 500));
        return NextResponse.json(
          { error: "فشل في تحليل الرد — يرجى المحاولة مرة أخرى" },
          { status: 500 }
        );
      }
    }

    const validated = {
      overallScore: typeof analysis.overallScore === "number" ? Math.min(100, Math.max(0, analysis.overallScore)) : 50,
      scoreLabel: typeof analysis.scoreLabel === "string" ? analysis.scoreLabel : "غير محدد",
      summary: typeof analysis.summary === "string" ? analysis.summary : "",
      dimensions: Array.isArray(analysis.dimensions)
        ? analysis.dimensions.map((d: Record<string, unknown>) => ({
            name: String(d.name || ""),
            nameEn: String(d.nameEn || ""),
            score: typeof d.score === "number" ? d.score : 0,
            maxScore: typeof d.maxScore === "number" ? d.maxScore : 25,
            detail: String(d.detail || ""),
            icon: String(d.icon || "circle"),
          }))
        : [],
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.filter((s: unknown) => typeof s === "string") : [],
      concerns: Array.isArray(analysis.concerns) ? analysis.concerns.filter((s: unknown) => typeof s === "string") : [],
      experienceHighlights: Array.isArray(analysis.experienceHighlights) ? analysis.experienceHighlights.filter((s: unknown) => typeof s === "string") : [],
      educationSummary: typeof analysis.educationSummary === "string" ? analysis.educationSummary : "",
      skillsMatch: typeof analysis.skillsMatch === "string" ? analysis.skillsMatch : "",
      recommendation: typeof analysis.recommendation === "string" ? analysis.recommendation : "",
      suggestedQuestions: Array.isArray(analysis.suggestedQuestions) ? analysis.suggestedQuestions.filter((s: unknown) => typeof s === "string") : [],
    };

    return NextResponse.json({ analysis: validated });
  } catch (error) {
    console.error("Unhandled error:", error);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
