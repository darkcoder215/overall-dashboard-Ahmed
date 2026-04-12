import type { AIAnalysis, AISearchResult, Candidate, Offer } from "@/types";
import { FUNCTIONS_BASE } from "./supabase";

async function chatCompletion(messages: { role: string; content: string }[]): Promise<string> {
  const resp = await fetch(`${FUNCTIONS_BASE}/recruitment-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`فشل في الاتصال بخدمة الذكاء الاصطناعي (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  return data.response || data.choices?.[0]?.message?.content || "";
}

/* ── Candidate Analysis ─────────────────────────────── */

export async function analyzeCandidate(
  candidate: Candidate,
  offer: Offer | null
): Promise<AIAnalysis> {
  const jobContext = offer
    ? `الوظيفة: ${offer.title}\nالقسم: ${offer.department?.name || "غير محدد"}\nالوصف: ${offer.description || "غير متوفر"}\nالمتطلبات: ${offer.requirements || "غير متوفر"}`
    : "لا توجد وظيفة محددة";

  const candidateInfo = `
الاسم: ${candidate.name}
المصدر: ${candidate.source || "غير محدد"}
التقييمات الإيجابية: ${candidate.positive_ratings}/${candidate.ratings_count}
الروابط: ${candidate.links?.join(", ") || "لا توجد"}
تاريخ التقدم: ${candidate.created_at}
آخر نشاط: ${candidate.last_activity_at || "غير متوفر"}
المراحل الحالية: ${candidate.placements?.map(p => `وظيفة ${p.offer_id} - مرحلة ${p.stage_id}${p.disqualified ? " (مستبعد)" : ""}`).join("; ") || "لا توجد"}
`.trim();

  const prompt = `أنت خبير توظيف في شركة ثمانية الإعلامية. قم بتحليل المرشح التالي وتقديم تقييم شامل.

معلومات الوظيفة:
${jobContext}

معلومات المرشح:
${candidateInfo}

أجب بصيغة JSON فقط بالهيكل التالي (جميع النصوص بالعربية):
{
  "score": <رقم من 0 إلى 100>,
  "summary": "<ملخص التقييم في 2-3 جمل>",
  "strengths": ["<نقطة قوة 1>", "<نقطة قوة 2>", ...],
  "concerns": ["<ملاحظة 1>", "<ملاحظة 2>", ...],
  "recommendation": "<strong_hire|hire|maybe|pass>",
  "recommended_questions": ["<سؤال مقابلة 1>", "<سؤال 2>", "<سؤال 3>"],
  "skill_match": [
    {"skill": "<المهارة>", "level": "<strong|moderate|weak|unknown>", "evidence": "<الدليل>"}
  ]
}`;

  const raw = await chatCompletion([
    { role: "system", content: "أنت مساعد توظيف ذكي لشركة ثمانية. أجب دائمًا بصيغة JSON صالحة باللغة العربية." },
    { role: "user", content: prompt },
  ]);

  try {
    return JSON.parse(raw);
  } catch {
    return {
      score: 50,
      summary: raw.slice(0, 200),
      strengths: [],
      concerns: ["تعذر تحليل الاستجابة بشكل كامل"],
      recommendation: "maybe",
      recommended_questions: [],
      skill_match: [],
    };
  }
}

/* ── AI Search ──────────────────────────────────────── */

export async function aiSearch(
  query: string,
  candidates: Candidate[],
  offers: Offer[]
): Promise<AISearchResult[]> {
  const candidatesSummary = candidates.slice(0, 50).map((c) => ({
    id: c.id,
    name: c.name,
    source: c.source,
    emails: c.emails,
    ratings: `${c.positive_ratings}/${c.ratings_count}`,
    placements: c.placements?.length || 0,
    created: c.created_at,
  }));

  const offersSummary = offers.map((o) => ({
    id: o.id,
    title: o.title,
    department: o.department?.name,
    status: o.status,
  }));

  const prompt = `أنت محرك بحث ذكي للتوظيف. البحث: "${query}"

المرشحون المتاحون (JSON):
${JSON.stringify(candidatesSummary)}

الوظائف المتاحة:
${JSON.stringify(offersSummary)}

ابحث في المرشحين وأعد النتائج الأكثر صلة بالاستعلام. أجب بصيغة JSON:
{
  "results": [
    {"candidate_id": <number>, "relevance": <0-100>, "match_reason": "<سبب التطابق بالعربية>"}
  ]
}

أعد أفضل 10 نتائج كحد أقصى مرتبة حسب الصلة.`;

  const raw = await chatCompletion([
    { role: "system", content: "أنت محرك بحث ذكي للتوظيف. أجب دائمًا بصيغة JSON صالحة." },
    { role: "user", content: prompt },
  ]);

  try {
    const parsed = JSON.parse(raw);
    return (parsed.results || []).map((r: any) => ({
      candidate: candidates.find((c) => c.id === r.candidate_id) || candidates[0],
      relevance: r.relevance,
      match_reason: r.match_reason,
    })).filter((r: any) => r.candidate);
  } catch {
    return [];
  }
}

/* ── Pipeline Insights ──────────────────────────────── */

export async function getPipelineInsights(
  offers: Offer[],
  candidates: Candidate[]
): Promise<string> {
  const summary = {
    total_jobs: offers.length,
    open_jobs: offers.filter((o) => o.status === "published").length,
    total_candidates: candidates.length,
    disqualified: candidates.filter((c) => c.placements?.some((p) => p.disqualified)).length,
    sources: {} as Record<string, number>,
    departments: {} as Record<string, number>,
  };

  candidates.forEach((c) => {
    const src = c.source || "غير محدد";
    summary.sources[src] = (summary.sources[src] || 0) + 1;
  });

  offers.forEach((o) => {
    const dept = o.department?.name || "غير محدد";
    summary.departments[dept] = (summary.departments[dept] || 0) + 1;
  });

  const prompt = `أنت محلل توظيف خبير في شركة ثمانية. قم بتحليل بيانات التوظيف التالية وقدم 3-5 رؤى عملية مفيدة لمدراء التوظيف.

البيانات:
${JSON.stringify(summary, null, 2)}

أجب بالعربية في فقرة واحدة مختصرة (3-5 جمل) تتضمن أهم الملاحظات والتوصيات.`;

  return chatCompletion([
    { role: "system", content: "أنت محلل توظيف خبير. أجب بالعربية بشكل مختصر ومفيد." },
    { role: "user", content: prompt },
  ]);
}
