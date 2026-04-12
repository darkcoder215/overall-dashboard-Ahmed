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

const API_BASE = "https://api.recruitee.com";

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
    await supabase.from("recruitment_config").update(payload).eq("id", cfg.id);
  } else {
    await supabase.from("recruitment_config").insert(payload);
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

  // Try Supabase Edge Function proxy first
  try {
    const proxyResp = await fetch(`${FUNCTIONS_BASE}/recruitment-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_P_AoE0x-HsqrJTarwZOT7Q_0UE2trZv")}`,
      },
      body: JSON.stringify({ path, method: opts?.method || "GET", body: opts?.body }),
    });
    if (proxyResp.ok) {
      return proxyResp.json();
    }
  } catch {
    // proxy not available — fall through to direct call
  }

  // Direct API call fallback
  const url = `${API_BASE}/c/${cfg.company_id}${path}`;
  const resp = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${cfg.api_token}`,
      "Content-Type": "application/json",
      ...(opts?.headers || {}),
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Recruitee API error ${resp.status}: ${text}`);
  }
  return resp.json();
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

/* ── Connection test ────────────────────────────────── */

export async function testConnection(companyId: string, token: string): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}/c/${companyId}/offers?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return resp.ok;
  } catch {
    return false;
  }
}
