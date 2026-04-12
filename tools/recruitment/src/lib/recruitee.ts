import type {
  Candidate,
  CandidateNote,
  Department,
  Location,
  Offer,
  PipelineTemplate,
  RecruiteeConfig,
} from "@/types";
import { supabase, FUNCTIONS_BASE } from "./supabase";

let _config: RecruiteeConfig | null = null;

/* ── Config ─────────────────────────────────────────── */

export async function loadConfig(): Promise<RecruiteeConfig | null> {
  if (_config) return _config;

  const { data } = await supabase
    .from("recruitment_config")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (data) {
    _config = {
      id: data.id,
      company_id: data.company_id,
      api_token: data.api_token,
      company_name: data.company_name,
    };
  }
  return _config;
}

export async function saveConfig(cfg: RecruiteeConfig) {
  const payload = {
    company_id: cfg.company_id,
    api_token: cfg.api_token,
    company_name: cfg.company_name || "",
  };

  if (cfg.id) {
    // Update existing row
    const { error } = await supabase
      .from("recruitment_config")
      .update(payload)
      .eq("id", cfg.id);
    if (error) throw error;
  } else {
    // Delete any existing rows first (singleton), then insert
    await supabase.from("recruitment_config").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error } = await supabase.from("recruitment_config").insert(payload);
    if (error) throw error;
  }
  _config = null; // bust cache
}

export function clearConfigCache() {
  _config = null;
}

/* ── Recruitee REST helpers ─────────────────────────── */

async function api<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const cfg = await loadConfig();
  if (!cfg) throw new Error("لم يتم إعداد اتصال Recruitee بعد");

  // Route through Supabase Edge Function proxy (avoids CORS)
  const proxyResp = await fetch(`${FUNCTIONS_BASE}/recruitment-proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path,
      method: opts?.method || "GET",
      body: opts?.body ? JSON.parse(opts.body as string) : undefined,
    }),
  });

  if (!proxyResp.ok) {
    const errBody = await proxyResp.text().catch(() => "");
    throw new Error(`خطأ في الاتصال بـ Recruitee (${proxyResp.status}): ${errBody}`);
  }

  return proxyResp.json();
}

/* ── Offers (Jobs) ──────────────────────────────────── */

export async function getOffers(status?: string): Promise<Offer[]> {
  const params = status ? `?scope=${status}` : "";
  const data = await api<{ offers: Offer[] }>(`/offers${params}`);
  return data.offers || [];
}

export async function getOffer(id: number): Promise<Offer> {
  const data = await api<{ offer: Offer }>(`/offers/${id}`);
  return data.offer;
}

/* ── Candidates ─────────────────────────────────────── */

export async function getCandidates(params?: {
  limit?: number;
  offset?: number;
  offer_id?: number;
  query?: string;
  qualified?: boolean;
  disqualified?: boolean;
  sort?: string;
  created_after?: string;
}): Promise<{ candidates: Candidate[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  if (params?.offer_id) qs.set("offer_id", String(params.offer_id));
  if (params?.query) qs.set("query", params.query);
  if (params?.qualified !== undefined) qs.set("qualified", String(params.qualified));
  if (params?.disqualified !== undefined) qs.set("disqualified", String(params.disqualified));
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.created_after) qs.set("created_after", params.created_after);

  const qstr = qs.toString();
  const data = await api<{ candidates: Candidate[]; total?: number }>(
    `/search/new/candidates${qstr ? `?${qstr}` : ""}`
  );
  return { candidates: data.candidates || [], total: data.total || data.candidates?.length || 0 };
}

export async function getCandidate(id: number): Promise<Candidate> {
  const data = await api<{ candidate: Candidate }>(`/candidates/${id}`);
  return data.candidate;
}

/* ── Notes ──────────────────────────────────────────── */

export async function getCandidateNotes(candidateId: number): Promise<CandidateNote[]> {
  const data = await api<{ notes: CandidateNote[] }>(`/candidates/${candidateId}/notes`);
  return data.notes || [];
}

export async function addCandidateNote(candidateId: number, body: string) {
  return api(`/candidates/${candidateId}/notes`, {
    method: "POST",
    body: JSON.stringify({ note: { body } }),
  });
}

/* ── Departments ────────────────────────────────────── */

export async function getDepartments(): Promise<Department[]> {
  const data = await api<{ departments: Department[] }>("/departments");
  return data.departments || [];
}

/* ── Locations ──────────────────────────────────────── */

export async function getLocations(): Promise<Location[]> {
  const data = await api<{ locations: Location[] }>("/locations");
  return data.locations || [];
}

/* ── Pipeline Templates ─────────────────────────────── */

export async function getPipelineTemplates(): Promise<PipelineTemplate[]> {
  const data = await api<{ pipeline_templates: PipelineTemplate[] }>("/pipeline_templates");
  return data.pipeline_templates || [];
}

/* ── Connection test (via proxy) ───────────────────── */

export async function testConnection(companyId: string, token: string): Promise<boolean> {
  try {
    // Test by making a direct call to Recruitee (server-side via proxy won't
    // have config saved yet, so we test directly). We wrap in a try since
    // CORS may block — if it does, we try the proxy as a fallback.
    const resp = await fetch(`https://api.recruitee.com/c/${companyId}/offers?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return resp.ok;
  } catch {
    // CORS blocked — try via a simple HEAD-like check through proxy
    // If config is already saved, the proxy will work
    try {
      const proxyResp = await fetch(`${FUNCTIONS_BASE}/recruitment-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "/offers?limit=1", method: "GET" }),
      });
      return proxyResp.ok;
    } catch {
      return false;
    }
  }
}
