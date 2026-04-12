// Supabase Edge Function: Recruitment API Proxy
// Proxies requests to the Recruitee API, keeping the API token server-side.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RECRUITEE_API = "https://api.recruitee.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Load config from Supabase
    const { data: config } = await supabaseClient
      .from("recruitment_config")
      .select("company_id, api_token")
      .limit(1)
      .single();

    if (!config) {
      return new Response(
        JSON.stringify({ error: "Recruitee not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { path, method = "GET", body } = await req.json();

    const url = `${RECRUITEE_API}/c/${config.company_id}${path}`;
    const fetchOpts: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${config.api_token}`,
        "Content-Type": "application/json",
      },
    };
    if (body && method !== "GET") {
      fetchOpts.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const resp = await fetch(url, fetchOpts);
    const data = await resp.json();

    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
