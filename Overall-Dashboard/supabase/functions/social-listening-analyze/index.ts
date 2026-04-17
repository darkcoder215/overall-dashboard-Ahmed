// @ts-nocheck
// ---------------------------------------------------------------------------
// social-listening-analyze — OpenRouter proxy for the Social Listening tool.
//
// The Data-Weaver bundle used to ship a hard-coded OpenRouter key in the
// browser (see earlier versions of src/lib/ai-analysis.ts). This function
// moves the key server-side. The client posts an OpenRouter-compatible
// chat-completions payload; the function forwards it with the stored
// `OPENROUTER_API_KEY` and returns the raw JSON response.
//
// Request (JSON):
//   {
//     "model":           "...",
//     "messages":        [...],       // required
//     "max_tokens":      4096,
//     "response_format": {...},
//     "temperature":     0
//   }
//
// Response (JSON): the upstream OpenRouter response, untouched.
//
// Auth:
//   Requires a signed-in Supabase user — the publishable key alone is
//   not enough to burn the OpenRouter quota. The function rejects anon
//   callers with 401.
// ---------------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

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
  try { body = await req.json(); } catch { return json({ error: "invalid_json_body" }, 400); }

  if (!body || !Array.isArray(body.messages) || !body.model) {
    return json({ error: "model and messages are required" }, 400);
  }

  // Pass through only the fields OpenRouter expects — avoid echoing any
  // extra client-supplied params that could leak into upstream logs.
  const payload = {
    model: body.model,
    messages: body.messages,
    max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 4096,
    temperature: typeof body.temperature === "number" ? body.temperature : 0,
    ...(body.response_format ? { response_format: body.response_format } : {}),
  };

  const upstream = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://thmanyah.com/social-listening",
      "X-Title": "Thmanyah Social Listening",
    },
    body: JSON.stringify(payload),
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    return json(
      { error: "openrouter_error", status: upstream.status, detail: text.slice(0, 500) },
      502,
    );
  }

  // Upstream already returns JSON — parse-and-reserialize so we can
  // guarantee CORS headers even if upstream sent a weird content-type.
  let parsed;
  try { parsed = JSON.parse(text); }
  catch { return json({ error: "invalid_upstream_json" }, 502); }
  return json(parsed);
});
