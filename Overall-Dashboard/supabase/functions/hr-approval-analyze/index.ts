// @ts-nocheck
// ---------------------------------------------------------------------------
// hr-approval-analyze — OpenRouter proxy for the HR Approval tool.
//
// The HR Approval tool builds a static export (`output: 'export'`), so its
// original Next.js Route Handler at `/api/analyze` cannot run at request
// time. The client now POSTs the raw form payload to this edge function,
// which holds the OpenRouter API key server-side.
//
// Request (JSON):
//   { "formData": { …the submit form fields… }, "model": "google/gemini-3.1-pro-preview" }
//
// Response (JSON):
//   { "analysis": { …validated analysis… } }
//   or
//   { "error": "...", "debug": "..." } on failure (HTTP 4xx/5xx)
//
// Auth: requires a Supabase JWT (sign-in enforced client-side before call).
// ---------------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3.1-pro-preview";
const REQUEST_TIMEOUT_MS = 60_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    overallScore: { type: "number" },
    scoreLabel: { type: "string" },
    summary: { type: "string" },
    dimensions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          score: { type: "number" },
          maxScore: { type: "number" },
          detail: { type: "string" },
        },
        required: ["name", "score", "maxScore", "detail"],
      },
    },
    strengths: { type: "array", items: { type: "string" } },
    concerns: { type: "array", items: { type: "string" } },
    aiRiskAssessment: { type: "string" },
    budgetConsideration: { type: "string" },
    recommendation: { type: "string" },
    suggestedQuestions: { type: "array", items: { type: "string" } },
  },
  required: [
    "overallScore", "scoreLabel", "summary", "dimensions",
    "strengths", "concerns", "aiRiskAssessment", "budgetConsideration",
    "recommendation", "suggestedQuestions",
  ],
};

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

أجب بتنسيق JSON فقط.

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

function getScoreLabel(score: number): string {
  if (score >= 85) return "حاجة ملحة";
  if (score >= 70) return "حاجة مبررة";
  if (score >= 50) return "حاجة متوسطة";
  if (score >= 30) return "حاجة ضعيفة";
  return "غير مبرر";
}

function parseAnalysisContent(content: string): any {
  try { return JSON.parse(content); } catch { /* try next */ }
  const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock?.[1]) {
    try { return JSON.parse(codeBlock[1].trim()); } catch { /* try next */ }
  }
  const brace = content.match(/\{[\s\S]*\}/);
  if (brace) {
    try { return JSON.parse(brace[0]); } catch { /* fallthrough */ }
  }
  throw new Error("Model response was not valid JSON");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) return json({ error: "OPENROUTER_API_KEY not configured on the server" }, 500);

  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";

  const supabase = createClient(supaUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) return json({ error: "unauthorized" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "طلب غير صالح — تعذر قراءة البيانات", debug: "Invalid JSON" }, 400); }

  const formData = body?.formData;
  if (!formData || typeof formData !== "object") {
    return json({ error: "بيانات النموذج مطلوبة", debug: "Missing or invalid formData field" }, 400);
  }
  const model = typeof body?.model === "string" && body.model ? body.model : DEFAULT_MODEL;

  const payload = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildAnalysisPrompt(formData) },
    ],
    temperature: 0.2,
    max_tokens: 4000,
    response_format: {
      type: "json_schema",
      json_schema: { name: "vacancy_analysis", strict: true, schema: ANALYSIS_SCHEMA },
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hr-approval.thmanyah.com",
        "X-Title": "Thmanyah HR Vacancy Approval",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    return json({
      error: isAbort
        ? "انتهت مهلة الاتصال بخدمة التحليل — يرجى المحاولة مرة أخرى"
        : "تعذر الاتصال بخدمة التحليل",
      debug: isAbort ? `Timed out after ${REQUEST_TIMEOUT_MS / 1000}s` : String(err),
    }, 504);
  } finally {
    clearTimeout(timeout);
  }

  if (!upstream.ok) {
    const errBody = await upstream.text().catch(() => "");
    const statusMessages: Record<number, string> = {
      400: "طلب غير صالح — تحقق من إعدادات النموذج",
      401: "مفتاح API غير صالح",
      402: "رصيد OpenRouter غير كافٍ",
      403: "الوصول مرفوض",
      404: `النموذج ${model} غير متوفر على OpenRouter`,
      429: "تجاوزت حد الطلبات — يرجى المحاولة بعد قليل",
      500: "خطأ داخلي في خدمة OpenRouter",
      502: "خدمة OpenRouter غير متاحة مؤقتاً",
      503: "خدمة OpenRouter مشغولة — يرجى المحاولة لاحقاً",
    };
    return json({
      error: statusMessages[upstream.status] || `فشل في الاتصال بخدمة التحليل (${upstream.status})`,
      debug: errBody.slice(0, 1000),
    }, 502);
  }

  let data: any;
  try { data = await upstream.json(); }
  catch { return json({ error: "رد غير صالح من خدمة التحليل", debug: "Non-JSON response" }, 502); }

  if (data?.error) {
    const msg = typeof data.error === "object" ? (data.error.message || JSON.stringify(data.error)) : String(data.error);
    return json({ error: "خطأ من خدمة التحليل", debug: msg }, 502);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) return json({ error: "لم نستلم ردًا من خدمة التحليل", debug: "empty content" }, 502);

  let analysis: any;
  try { analysis = parseAnalysisContent(String(content)); }
  catch (err) {
    return json({
      error: "فشل في تحليل رد الذكاء الاصطناعي — الرد لم يكن بتنسيق JSON صحيح",
      debug: `${err instanceof Error ? err.message : String(err)}\n\n${String(content).slice(0, 500)}`,
    }, 502);
  }

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

  return json({ analysis: validated });
});
