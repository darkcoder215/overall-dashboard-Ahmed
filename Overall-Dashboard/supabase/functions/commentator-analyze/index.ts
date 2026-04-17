// @ts-nocheck
// ---------------------------------------------------------------------------
// commentator-analyze — OpenRouter proxy for the Commentator tool.
//
// The Commentator tool used to ship a hard-coded OpenRouter API key in the
// browser bundle. This edge function replaces that flow: the client POSTs
// the base64 audio (or an HTTP reference) + format to this function, and
// the function holds the API key server-side.
//
// Request (JSON):
//   {
//     "audio_base64": "…",          // preferred for <= 25 MB files
//     "audio_format": "wav|mp3|…",
//     "match_hint":   "اختياري",    // optional natural-language hint
//     "model":        "google/gemini-2.5-pro",
//     "persist":      true          // insert into commentator.reports
//   }
//
// Response (JSON):
//   {
//     "report":   { … validated report … },
//     "report_id": "uuid" | null
//   }
//
// Auth:
//   Requires a signed-in Supabase user (JWT in Authorization: Bearer …).
//   The function rejects anon requests, so an attacker can't burn the
//   OpenRouter quota with the publishable key alone.
// ---------------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-pro";

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

function analysisPrompt(hint?: string) {
  return [
    "أنت خبير في تقييم أداء معلقي كرة القدم وفقًا لأعلى المعايير المهنية.",
    "استمع إلى الملف الصوتي وأعد النتيجة كـ JSON صالح فقط (بدون أي نص خارج JSON).",
    "الهيكل المطلوب:",
    '{ "match_info": {"team_a","team_b","score","competition","date"},',
    '  "commentator": {"name","channel"},',
    '  "overall": {"score":0-100,"rating","summary"},',
    '  "tags": [...],',
    '  "categories": [ {"name","score":0-100,"rating","criteria":[{"name","score","note"}]} ],',
    '  "performance_stats": {"words_per_minute","total_words","silence_percentage","unique_vocabulary","repetition_rate","factual_errors","analyst_interactions","peak_excitement_count"},',
    '  "notable_quotes": [{"time","text","context"}],',
    '  "excitement_timeline": [0-100, …],',
    '  "key_moments": [{"time","type":"excellent|note|needs_improvement","description"}],',
    '  "strengths": [...], "improvements": [...],',
    '  "transcription": [{"time","speaker","text"}] }',
    "يجب أن تغطي النتيجة 8 محاور و32 معيارًا فرعيًا بالضبط.",
    hint ? `ملاحظات من المستخدم: ${hint}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function extractJson(text: string): unknown {
  // Strip markdown fencing, then try increasingly forgiving parses.
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try { return JSON.parse(cleaned); } catch { /* fallthrough */ }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* fallthrough */ }
    try { return JSON.parse(match[0].replace(/,\s*([}\]])/g, "$1")); } catch { /* fallthrough */ }
  }
  throw new Error("Model response was not valid JSON");
}

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function normaliseReport(raw: any) {
  return {
    match_info: {
      team_a: raw?.match_info?.team_a || "",
      team_b: raw?.match_info?.team_b || "",
      score: raw?.match_info?.score || "",
      competition: raw?.match_info?.competition || "",
      date: raw?.match_info?.date || "",
    },
    commentator: {
      name: raw?.commentator?.name || "",
      channel: raw?.commentator?.channel || "",
    },
    overall: {
      score: clampScore(raw?.overall?.score),
      rating: raw?.overall?.rating || "",
      summary: raw?.overall?.summary || "",
    },
    tags: Array.isArray(raw?.tags) ? raw.tags.slice(0, 6) : [],
    categories: Array.isArray(raw?.categories)
      ? raw.categories.map((c: any) => ({
          name: String(c?.name || ""),
          score: clampScore(c?.score),
          rating: c?.rating || "",
          criteria: Array.isArray(c?.criteria)
            ? c.criteria.map((cr: any) => ({
                name: String(cr?.name || ""),
                score: clampScore(cr?.score),
                note: String(cr?.note || ""),
              }))
            : [],
        }))
      : [],
    performance_stats: raw?.performance_stats ?? null,
    notable_quotes: Array.isArray(raw?.notable_quotes) ? raw.notable_quotes : [],
    excitement_timeline: Array.isArray(raw?.excitement_timeline)
      ? raw.excitement_timeline.map(clampScore)
      : [],
    key_moments: Array.isArray(raw?.key_moments) ? raw.key_moments : [],
    strengths: Array.isArray(raw?.strengths) ? raw.strengths : [],
    improvements: Array.isArray(raw?.improvements) ? raw.improvements : [],
    transcription: Array.isArray(raw?.transcription) ? raw.transcription : [],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) return json({ error: "OPENROUTER_API_KEY not configured on the server" }, 500);

  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";

  // User-scoped client — RLS enforces `user_id = auth.uid()`.
  const supabase = createClient(supaUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return json({ error: "unauthorized" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_json_body" }, 400); }

  const audioB64 = typeof body?.audio_base64 === "string" ? body.audio_base64 : null;
  const format = typeof body?.audio_format === "string" ? body.audio_format : "mp3";
  const model = typeof body?.model === "string" && body.model ? body.model : DEFAULT_MODEL;
  const persist = body?.persist !== false;
  if (!audioB64) return json({ error: "audio_base64 is required" }, 400);

  const payload = {
    model,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: analysisPrompt(body?.match_hint) },
        { type: "input_audio", input_audio: { data: audioB64, format } },
      ],
    }],
  };

  const upstream = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://thmanyah.com/commentator",
      "X-Title": "Thmanyah Commentator",
    },
    body: JSON.stringify(payload),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    return json({ error: "openrouter_error", status: upstream.status, detail: errText.slice(0, 500) }, 502);
  }

  const data = await upstream.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return json({ error: "empty_model_response" }, 502);

  let report;
  try { report = normaliseReport(extractJson(String(content))); }
  catch (err) { return json({ error: "invalid_model_response", detail: String(err) }, 502); }

  let reportId: string | null = null;
  if (persist) {
    const { data: row, error } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        commentator_name: report.commentator.name || null,
        channel: report.commentator.channel || null,
        match_label: report.match_info.competition || null,
        overall_score: report.overall.score,
        report,
        model,
      })
      .select("id")
      .single();
    // NOTE: `.from("reports")` hits the default `public` schema under
    // PostgREST; the table lives in the `commentator` schema. We override
    // the schema header below via the typed client's `.schema()` helper
    // rather than relying on a search_path change.
    if (error) {
      // Retry via the commentator schema.
      const alt = await supabase.schema("commentator").from("reports").insert({
        user_id: user.id,
        commentator_name: report.commentator.name || null,
        channel: report.commentator.channel || null,
        match_label: report.match_info.competition || null,
        overall_score: report.overall.score,
        report,
        model,
      }).select("id").single();
      if (!alt.error && alt.data) reportId = alt.data.id;
    } else if (row) {
      reportId = row.id;
    }
  }

  return json({ report, report_id: reportId });
});
