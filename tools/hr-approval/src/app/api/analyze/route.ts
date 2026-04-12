import { NextRequest, NextResponse } from "next/server";

const AI_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3.1-pro-preview";
const REQUEST_TIMEOUT_MS = 60_000;

const ANALYSIS_SCHEMA = {
  type: "object" as const,
  properties: {
    overallScore: { type: "number" as const, description: "Score from 0 to 100" },
    scoreLabel: { type: "string" as const, description: "حاجة ملحة / حاجة مبررة / حاجة متوسطة / حاجة ضعيفة / غير مبرر" },
    summary: { type: "string" as const, description: "Executive summary in 3-4 sentences" },
    dimensions: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          name: { type: "string" as const },
          score: { type: "number" as const },
          maxScore: { type: "number" as const },
          detail: { type: "string" as const },
        },
        required: ["name", "score", "maxScore", "detail"],
      },
    },
    strengths: { type: "array" as const, items: { type: "string" as const } },
    concerns: { type: "array" as const, items: { type: "string" as const } },
    aiRiskAssessment: { type: "string" as const },
    budgetConsideration: { type: "string" as const },
    recommendation: { type: "string" as const },
    suggestedQuestions: { type: "array" as const, items: { type: "string" as const } },
  },
  required: [
    "overallScore", "scoreLabel", "summary", "dimensions",
    "strengths", "concerns", "aiRiskAssessment", "budgetConsideration",
    "recommendation", "suggestedQuestions",
  ],
};

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "طلب غير صالح — تعذر قراءة البيانات", debug: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { formData } = body;
    if (!formData || typeof formData !== "object") {
      return NextResponse.json(
        { error: "بيانات النموذج مطلوبة", debug: "Missing or invalid formData field" },
        { status: 400 }
      );
    }

    // Check API key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "مفتاح API غير مُعرّف", debug: "OPENROUTER_API_KEY environment variable is not set. Add it in Vercel → Settings → Environment Variables." },
        { status: 500 }
      );
    }

    const prompt = buildAnalysisPrompt(formData);

    // Build the OpenRouter request payload
    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 4000,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "vacancy_analysis",
          strict: true,
          schema: ANALYSIS_SCHEMA,
        },
      },
    };

    // Call OpenRouter with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(AI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://hr-approval.thmanyah.com",
          "X-Title": "Thmanyah HR Vacancy Approval",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      const isAbort = fetchErr instanceof DOMException && fetchErr.name === "AbortError";
      console.error("Fetch error:", fetchErr);
      return NextResponse.json(
        {
          error: isAbort
            ? "انتهت مهلة الاتصال بخدمة التحليل — يرجى المحاولة مرة أخرى"
            : "تعذر الاتصال بخدمة التحليل",
          debug: isAbort
            ? `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
            : String(fetchErr),
        },
        { status: 504 }
      );
    } finally {
      clearTimeout(timeout);
    }

    // Handle non-OK responses — surface the full error
    if (!response.ok) {
      let errorBody: string;
      try {
        errorBody = await response.text();
      } catch {
        errorBody = "(could not read error body)";
      }
      console.error(`OpenRouter API error [${response.status}]:`, errorBody);

      const statusMessages: Record<number, string> = {
        400: "طلب غير صالح — تحقق من إعدادات النموذج",
        401: "مفتاح API غير صالح — يرجى التحقق من OPENROUTER_API_KEY",
        402: "رصيد OpenRouter غير كافٍ",
        403: "الوصول مرفوض — تحقق من صلاحيات مفتاح API",
        404: `النموذج ${MODEL} غير متوفر على OpenRouter`,
        429: "تجاوزت حد الطلبات — يرجى المحاولة بعد قليل",
        500: "خطأ داخلي في خدمة OpenRouter",
        502: "خدمة OpenRouter غير متاحة مؤقتاً",
        503: "خدمة OpenRouter مشغولة — يرجى المحاولة لاحقاً",
      };

      return NextResponse.json(
        {
          error: statusMessages[response.status] || `فشل في الاتصال بخدمة التحليل (${response.status})`,
          debug: errorBody,
        },
        { status: 502 }
      );
    }

    // Parse the response
    let data;
    try {
      data = await response.json();
    } catch {
      console.error("Failed to parse OpenRouter response as JSON");
      return NextResponse.json(
        { error: "رد غير صالح من خدمة التحليل", debug: "OpenRouter returned non-JSON response" },
        { status: 502 }
      );
    }

    // Check for OpenRouter-level errors in the response body
    if (data.error) {
      const errMsg = typeof data.error === "object" ? (data.error.message || JSON.stringify(data.error)) : String(data.error);
      console.error("OpenRouter returned error in body:", errMsg);
      return NextResponse.json(
        { error: "خطأ من خدمة التحليل", debug: errMsg },
        { status: 502 }
      );
    }

    // Extract content
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("Empty content in OpenRouter response:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json(
        {
          error: "لم نستلم ردًا من خدمة التحليل",
          debug: `choices: ${JSON.stringify(data.choices?.slice(0, 1)).slice(0, 300)}`,
        },
        { status: 502 }
      );
    }

    // Parse JSON from content — try multiple strategies
    let analysis;
    try {
      // Strategy 1: Direct JSON parse (expected with structured output)
      analysis = JSON.parse(content);
    } catch {
      try {
        // Strategy 2: Extract from markdown code block
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch?.[1]) {
          analysis = JSON.parse(codeBlockMatch[1].trim());
        } else {
          // Strategy 3: Find first { ... } block
          const braceMatch = content.match(/\{[\s\S]*\}/);
          if (braceMatch) {
            analysis = JSON.parse(braceMatch[0]);
          } else {
            throw new Error("No JSON structure found");
          }
        }
      } catch (innerErr) {
        console.error("All JSON parsing strategies failed.\nRaw content:", content.slice(0, 1500));
        return NextResponse.json(
          {
            error: "فشل في تحليل رد الذكاء الاصطناعي — الرد لم يكن بتنسيق JSON صحيح",
            debug: `Parse error: ${innerErr instanceof Error ? innerErr.message : String(innerErr)}\n\nRaw response (first 500 chars):\n${content.slice(0, 500)}`,
          },
          { status: 500 }
        );
      }
    }

    // Validate and normalize the analysis with defaults for missing fields
    const validated = {
      overallScore: typeof analysis.overallScore === "number" ? Math.min(100, Math.max(0, analysis.overallScore)) : 50,
      scoreLabel: typeof analysis.scoreLabel === "string" ? analysis.scoreLabel : getScoreLabel(analysis.overallScore),
      summary: typeof analysis.summary === "string" ? analysis.summary : "لا يوجد ملخص",
      dimensions: Array.isArray(analysis.dimensions)
        ? analysis.dimensions.map((d: Record<string, unknown>) => ({
            name: String(d.name || ""),
            score: typeof d.score === "number" ? d.score : 0,
            maxScore: typeof d.maxScore === "number" ? d.maxScore : 20,
            detail: String(d.detail || ""),
          }))
        : [],
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.filter((s: unknown) => typeof s === "string") : [],
      concerns: Array.isArray(analysis.concerns) ? analysis.concerns.filter((s: unknown) => typeof s === "string") : [],
      aiRiskAssessment: typeof analysis.aiRiskAssessment === "string" ? analysis.aiRiskAssessment : "",
      budgetConsideration: typeof analysis.budgetConsideration === "string" ? analysis.budgetConsideration : "",
      recommendation: typeof analysis.recommendation === "string" ? analysis.recommendation : "يرجى المتابعة مع إدارة المواهب",
      suggestedQuestions: Array.isArray(analysis.suggestedQuestions) ? analysis.suggestedQuestions.filter((s: unknown) => typeof s === "string") : [],
    };

    return NextResponse.json({ analysis: validated });
  } catch (error) {
    console.error("Unhandled analysis API error:", error);
    return NextResponse.json(
      {
        error: "حدث خطأ غير متوقع",
        debug: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      },
      { status: 500 }
    );
  }
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "حاجة ملحة";
  if (score >= 70) return "حاجة مبررة";
  if (score >= 50) return "حاجة متوسطة";
  if (score >= 30) return "حاجة ضعيفة";
  return "غير مبرر";
}

const SYSTEM_PROMPT = `أنت محلل موارد بشرية استراتيجي خبير تعمل في شركة ثمانية الإعلامية السعودية — واحدة من أبرز شركات الإعلام والمحتوى في المنطقة. مهمتك إجراء تحليل عميق وشامل لطلبات فتح الشواغر الوظيفية.

## معايير التقييم (وزّع النقاط على أساس 100):

### 1. وضوح الحاجة والتبرير (25 نقطة)
- هل المبرر واضح ومحدد أم عام وغامض؟
- هل المخاطر المذكورة حقيقية وقابلة للقياس أم مبالغ فيها؟
- هل العدد المطلوب متناسب مع الحاجة المذكورة؟
- هل هناك ارتباط واضح بمشروع أو هدف استراتيجي؟

### 2. استنفاد البدائل (20 نقطة)
- هل جُرِّبت حلول بديلة فعلاً (إعادة توزيع، أتمتة، تعاقد خارجي)؟
- إذا لم تُجرَّب، هل السبب مقنع؟
- هل يمكن تحقيق المطلوب بأقل من العدد المطلوب؟

### 3. تقييم أثر الذكاء الاصطناعي (20 نقطة)
- هل مقدم الطلب واعٍ لأثر AI على هذا الدور؟
- هل نسبة الأتمتة مُقدَّرة بواقعية؟
- هل الدور معرض للاستبدال بالذكاء الاصطناعي خلال 2-3 سنوات؟
- هل يمكن دمج أدوات AI لتقليل العدد المطلوب؟

### 4. تعريف النجاح والمخرجات (20 نقطة)
- هل المخرجات المتوقعة واضحة وقابلة للقياس؟
- هل مؤشرات النجاح محددة أم عامة؟
- هل هناك فرق واضح بين مخرجات 3 أشهر و6 أشهر (تدرج منطقي)؟

### 5. جودة الطلب والاتساق (15 نقطة)
- هل الوصف الوظيفي مفصل وعملي؟
- هل معيار التوظيف المرفوع واقعي وطموح؟
- هل هناك تناقضات بين أجزاء الطلب؟
- هل الطلب يعكس تفكيراً عميقاً أم سريعاً وسطحياً؟

## تعليمات الإخراج:

أجب بتنسيق JSON فقط بالهيكلة التالية (بدون أي نص خارج JSON):
{
  "overallScore": <رقم من 0 إلى 100>,
  "scoreLabel": "<حاجة ملحة (85-100) / حاجة مبررة (70-84) / حاجة متوسطة (50-69) / حاجة ضعيفة (30-49) / غير مبرر (0-29)>",
  "summary": "<ملخص تنفيذي من 3-4 جمل يلخص الموقف والتوصية>",
  "dimensions": [
    {
      "name": "وضوح الحاجة والتبرير",
      "score": <0-25>,
      "maxScore": 25,
      "detail": "<تحليل مفصل في 2-3 جمل مع استشهاد بما كتبه مقدم الطلب>"
    },
    {
      "name": "استنفاد البدائل",
      "score": <0-20>,
      "maxScore": 20,
      "detail": "<تحليل مفصل>"
    },
    {
      "name": "أثر الذكاء الاصطناعي",
      "score": <0-20>,
      "maxScore": 20,
      "detail": "<تحليل مفصل>"
    },
    {
      "name": "تعريف النجاح والمخرجات",
      "score": <0-20>,
      "maxScore": 20,
      "detail": "<تحليل مفصل>"
    },
    {
      "name": "جودة الطلب والاتساق",
      "score": <0-15>,
      "maxScore": 15,
      "detail": "<تحليل مفصل>"
    }
  ],
  "strengths": ["<نقطة قوة مبنية على بيانات فعلية من الطلب>"],
  "concerns": ["<ملاحظة أو تحفظ محدد مع ذكر السبب>"],
  "aiRiskAssessment": "<تقييم مفصل في 3-4 جمل لخطر استبدال هذا الدور بالذكاء الاصطناعي مع نسبة تقديرية وإطار زمني>",
  "budgetConsideration": "<تعليق على الأثر المالي: هل التوظيف استثمار مبرر أم تكلفة يمكن تجنبها؟ جملتين>",
  "recommendation": "<توصية نهائية واضحة ومحددة في 2-3 جمل>",
  "suggestedQuestions": ["<سؤال يجب طرحه على مقدم الطلب لتقوية القرار>", "<سؤال آخر>"]
}

## تعليمات مهمة:
- كن صريحاً ومباشراً — لا تجامل. إذا كان الطلب ضعيفاً قل ذلك بوضوح.
- استشهد بكلام مقدم الطلب الفعلي عند الإشارة لنقاط القوة أو الضعف.
- إذا كانت الإجابات عامة أو منسوخة، أشر لذلك.
- قيّم بناءً على ما كُتب فعلاً وليس على افتراضات.
- النسبة يجب أن تعكس التقييم الفعلي — لا تعطِ نسباً عالية من باب المجاملة.`;

function buildAnalysisPrompt(form: Record<string, string>): string {
  const vacancyTypeLabel = form.vacancyType === "replacement" ? "بديل لموظف سابق" : "شاغر مستحدث";
  const triedAlt = form.triedAlternatives === "yes" ? "نعم" : "لا";
  const roleNatureMap: Record<string, string> = {
    full_time: "دوام كامل",
    part_time: "دوام جزئي",
    contract: "عقد محدد المدة",
    freelance: "مستقل",
    intern: "متدرب",
  };

  let prompt = `# طلب فتح شاغر وظيفي — تحليل شامل

## البيانات الأساسية
| البند | القيمة |
|-------|--------|
| مقدم الطلب | ${form.requesterName} (${form.requesterEmail}) |
| الإدارة | ${form.department} |
| القسم | ${form.section || "غير محدد"} |
| الفريق | ${form.team} |
| المشروع | ${form.project || "غير محدد"} |
| صاحب الميزانية | ${form.budgetOwner} |
| نوع الشاغر | ${vacancyTypeLabel} |
| العدد المطلوب | ${form.positionsCount} |
`;

  if (form.vacancyType === "replacement") {
    prompt += `
## بيانات الموظف السابق
| البند | القيمة |
|-------|--------|
| الاسم | ${form.previousEmployeeName} |
| تاريخ المغادرة | ${form.departureDate} |
| نوع المغادرة | ${form.departureType === "resignation" ? "استقالة" : "فصل"} |
| سبب المغادرة | ${form.departureReason} |
`;
  }

  if (form.vacancyType === "new_position") {
    prompt += `
## تفاصيل الشاغر المستحدث
| البند | القيمة |
|-------|--------|
| ضمن الهيكلة المعتمدة | ${form.isInApprovedStructure === "yes" ? "نعم" : "لا"} |
${form.structureJustification ? `| تبرير خارج الهيكلة | ${form.structureJustification} |` : ""}
`;
  }

  prompt += `
## تفاصيل الدور الوظيفي
| البند | القيمة |
|-------|--------|
| المسمى الوظيفي | ${form.jobTitle} |
| المسمى باللغة الانقليزية | ${form.jobTitleEn} |
| المستوى | ${form.jobLevel} |
| طبيعة الدور | ${roleNatureMap[form.roleNature] || form.roleNature} |
| الدولة | ${form.country} |
| الجنسية | ${form.nationality === "saudi" ? "سعودي" : form.nationality === "arab" ? "عربي" : "غير عربي"} |

### الوصف الوظيفي:
${form.jobDescription}

## تقييم الحاجة
- **هل جرب حلول بديلة؟**: ${triedAlt}
${form.triedAlternatives === "yes" ? `- **الحلول المجربة ونتائجها**: ${form.alternativesDescription}` : ""}
${form.triedAlternatives === "no" ? `- **سبب عدم تجربة بدائل**: ${form.whyNoAlternatives || "لم يُذكر"}` : ""}

### المخاطر والآثار السلبية في حال عدم التوظيف:
${form.risksIfNotHired}

## تقييم الذكاء الاصطناعي (كما كتبه مقدم الطلب)

### كيف يمكن تفعيل AI في هذا الدور:
${form.aiRoleIntegration}

### المهام القابلة للأتمتة:
${form.aiAutomationPotential}

### تقييم إمكانية الاستبدال بالذكاء الاصطناعي:
${form.aiReplacementAssessment}

## رفع معيار اختيار المواهب
${form.hiringBarCommitment}

## تعريف النجاح
### المخرجات المتوقعة خلال أول 3 أشهر:
${form.expectedOutputs3Months || "لم يُحدد"}

### المخرجات المتوقعة خلال أول 6 أشهر:
${form.expectedOutputs6Months || "لم يُحدد"}

### مؤشرات قياس النجاح والأثر:
${form.successMetrics || "لم يُحدد"}

---
قدّم تحليلك الشامل بتنسيق JSON فقط.`;

  return prompt;
}
