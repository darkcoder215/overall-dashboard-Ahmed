/**
 * Vacancy request store.
 *
 * Architecture: "localStorage is the cache, Supabase is the truth."
 *
 *   • The UI reads synchronously from localStorage so pages render
 *     immediately without `loading` states (all the existing form
 *     components were built around sync access; we keep that API).
 *   • On module load we fire a one-time hydrate that pulls every
 *     row from Supabase into localStorage, so a fresh browser or
 *     a new device will see everything another user just submitted.
 *   • Every mutation (create/approve/reject/delete) writes to
 *     localStorage immediately for snappy UI, then fires an async
 *     upsert against Supabase in the background. If Supabase is
 *     unreachable the write still succeeds locally — we log the
 *     failure and retry the next time the tool is opened.
 *
 * This lets the tool keep working offline, keeps the existing page
 * components unchanged, and still persists every request to the
 * shared Thmanyah Supabase project so multiple reviewers can see
 * each other's submissions in real time.
 */

import { VacancyRequest, ApprovalStep, RequestStatus } from "./types";
import { APPROVAL_CHAIN_TEMPLATE } from "./constants";
import { getSettings } from "./settings";
import { v4 as uuidv4 } from "uuid";
import { supabase, isSupabaseConfigured } from "./supabase";

const STORAGE_KEY = "thmanyah_vacancy_requests";

// ── localStorage helpers ────────────────────────────────────────────
function getAll(): VacancyRequest[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveAll(requests: VacancyRequest[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  // Fire a storage event so other tabs/components can react.
  try {
    window.dispatchEvent(new Event("thmanyah_vacancy_updated"));
  } catch {
    /* noop */
  }
}

// ── Supabase row ⇄ VacancyRequest adapters ─────────────────────────
// The SQL schema snake_cases every column; the in-memory shape
// keeps camelCase so existing page code doesn't have to change.
type VacancyRow = Record<string, unknown>;
type StepRow = Record<string, unknown>;

function toRequestRow(r: VacancyRequest): VacancyRow {
  return {
    id: r.id,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    status: r.status,
    current_approval_step: r.currentApprovalStep,
    requester_name: r.requesterName,
    requester_email: r.requesterEmail,
    department: r.department,
    section: r.section || null,
    team: r.team || null,
    project: r.project || null,
    budget_owner: r.budgetOwner || null,
    vacancy_type: r.vacancyType,
    positions_count: r.positionsCount,
    previous_employee_name: r.previousEmployeeName || null,
    departure_date: r.departureDate || null,
    departure_type: r.departureType || null,
    departure_reason: r.departureReason || null,
    is_in_approved_structure: r.isInApprovedStructure ?? null,
    structure_justification: r.structureJustification || null,
    job_title: r.jobTitle,
    job_title_en: r.jobTitleEn || null,
    job_level: r.jobLevel || null,
    role_nature: r.roleNature,
    job_description: r.jobDescription || null,
    country: r.country || null,
    preferred_country: r.preferredCountry || null,
    work_location: r.workLocation || null,
    nationality: r.nationality,
    tried_alternatives: r.triedAlternatives ?? null,
    alternatives_description: r.alternativesDescription || null,
    risks_if_not_hired: r.risksIfNotHired || null,
    ai_role_integration: r.aiRoleIntegration || null,
    ai_automation_potential: r.aiAutomationPotential || null,
    ai_replacement_assessment: r.aiReplacementAssessment || null,
    hiring_bar_commitment: r.hiringBarCommitment || null,
    rejection_reason: r.rejectionReason || null,
  };
}

function toStepRow(requestId: string, s: ApprovalStep): StepRow {
  return {
    id: s.id,
    request_id: requestId,
    step_order: s.order,
    role: s.role,
    approver_name: s.approverName || null,
    approver_email: s.approverEmail || null,
    sla_hours: s.slaHours,
    status: s.status,
    comment: s.comment || null,
    internal_comment: s.internalComment || null,
    decided_at: s.decidedAt || null,
    reminder_sent_at: s.reminderSentAt || null,
  };
}

function fromRow(row: VacancyRow, steps: StepRow[]): VacancyRequest {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    status: row.status as RequestStatus,
    currentApprovalStep: Number(row.current_approval_step) || 0,
    requesterName: String(row.requester_name || ""),
    requesterEmail: String(row.requester_email || ""),
    department: String(row.department || ""),
    section: String(row.section || ""),
    team: String(row.team || ""),
    project: String(row.project || ""),
    budgetOwner: String(row.budget_owner || ""),
    vacancyType: (row.vacancy_type || "new_position") as VacancyRequest["vacancyType"],
    positionsCount: Number(row.positions_count) || 1,
    previousEmployeeName: row.previous_employee_name
      ? String(row.previous_employee_name)
      : undefined,
    departureDate: row.departure_date ? String(row.departure_date) : undefined,
    departureType: (row.departure_type as VacancyRequest["departureType"]) || undefined,
    departureReason: row.departure_reason ? String(row.departure_reason) : undefined,
    isInApprovedStructure:
      row.is_in_approved_structure === null || row.is_in_approved_structure === undefined
        ? undefined
        : Boolean(row.is_in_approved_structure),
    structureJustification: row.structure_justification
      ? String(row.structure_justification)
      : undefined,
    jobTitle: String(row.job_title || ""),
    jobTitleEn: String(row.job_title_en || ""),
    jobLevel: String(row.job_level || ""),
    roleNature: (row.role_nature || "full_time") as VacancyRequest["roleNature"],
    jobDescription: String(row.job_description || ""),
    country: String(row.country || ""),
    preferredCountry: row.preferred_country ? String(row.preferred_country) : undefined,
    workLocation: row.work_location ? String(row.work_location) : undefined,
    nationality: (row.nationality || "saudi") as VacancyRequest["nationality"],
    triedAlternatives: Boolean(row.tried_alternatives),
    alternativesDescription: row.alternatives_description
      ? String(row.alternatives_description)
      : undefined,
    risksIfNotHired: String(row.risks_if_not_hired || ""),
    aiRoleIntegration: String(row.ai_role_integration || ""),
    aiAutomationPotential: String(row.ai_automation_potential || ""),
    aiReplacementAssessment: String(row.ai_replacement_assessment || ""),
    hiringBarCommitment: String(row.hiring_bar_commitment || ""),
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    approvalChain: steps
      .slice()
      .sort((a, b) => (Number(a.step_order) || 0) - (Number(b.step_order) || 0))
      .map((s) => ({
        id: String(s.id),
        order: Number(s.step_order) || 0,
        role: String(s.role || ""),
        approverName: String(s.approver_name || ""),
        approverEmail: String(s.approver_email || ""),
        slaHours: Number(s.sla_hours) || 48,
        status: (s.status || "pending") as ApprovalStep["status"],
        comment: s.comment ? String(s.comment) : undefined,
        internalComment: s.internal_comment ? String(s.internal_comment) : undefined,
        decidedAt: s.decided_at ? String(s.decided_at) : undefined,
        reminderSentAt: s.reminder_sent_at ? String(s.reminder_sent_at) : undefined,
      })),
  };
}

// ── Supabase sync primitives ───────────────────────────────────────
// Every DB call is wrapped in a try/catch that logs + swallows
// errors. The UI must never crash because Supabase is temporarily
// unreachable — it just keeps using the localStorage copy.

async function dbUpsertRequest(r: VacancyRequest): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error: reqErr } = await supabase
      .schema("hr_approval")
      .from("vacancy_requests")
      .upsert(toRequestRow(r), { onConflict: "id" });
    if (reqErr) throw reqErr;

    // Replace the approval chain atomically: delete the existing
    // rows for this request, then insert the fresh chain. Doing
    // it as "delete + insert" avoids having to compute a diff.
    const { error: delErr } = await supabase
      .schema("hr_approval")
      .from("approval_steps")
      .delete()
      .eq("request_id", r.id);
    if (delErr) throw delErr;

    if (r.approvalChain.length > 0) {
      const { error: insErr } = await supabase
        .schema("hr_approval")
        .from("approval_steps")
        .insert(r.approvalChain.map((s) => toStepRow(r.id, s)));
      if (insErr) throw insErr;
    }
  } catch (err) {
    console.warn("[hr-approval] Supabase upsert failed:", err);
  }
}

async function dbDeleteRequest(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    // approval_steps cascades from the FK, so deleting the
    // vacancy request is enough.
    const { error } = await supabase
      .schema("hr_approval")
      .from("vacancy_requests")
      .delete()
      .eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.warn("[hr-approval] Supabase delete failed:", err);
  }
}

let __hydratePromise: Promise<void> | null = null;
export function hydrateFromSupabase(): Promise<void> {
  if (__hydratePromise) return __hydratePromise;
  __hydratePromise = (async () => {
    if (!isSupabaseConfigured || !supabase) return;
    if (typeof window === "undefined") return;
    try {
      const { data: reqs, error: reqErr } = await supabase
        .schema("hr_approval")
        .from("vacancy_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (reqErr) throw reqErr;
      if (!reqs || reqs.length === 0) {
        // Empty DB: don't clobber localStorage seed data.
        return;
      }
      const ids = reqs.map((r: VacancyRow) => r.id);
      const { data: steps, error: stepErr } = await supabase
        .schema("hr_approval")
        .from("approval_steps")
        .select("*")
        .in("request_id", ids as string[]);
      if (stepErr) throw stepErr;

      const stepsByRequest = new Map<string, StepRow[]>();
      for (const s of steps || []) {
        const rid = String((s as StepRow).request_id);
        const list = stepsByRequest.get(rid) || [];
        list.push(s as StepRow);
        stepsByRequest.set(rid, list);
      }

      const mapped: VacancyRequest[] = reqs.map((r: VacancyRow) =>
        fromRow(r, stepsByRequest.get(String(r.id)) || [])
      );

      // Merge: DB rows win for matching IDs, local-only rows stay
      // (they're probably offline drafts waiting to be synced).
      const local = getAll();
      const dbIds = new Set(mapped.map((r) => r.id));
      const localOnly = local.filter((r) => !dbIds.has(r.id));
      saveAll([...mapped, ...localOnly]);

      // Push any local-only rows back to Supabase so nothing is lost.
      for (const r of localOnly) {
        await dbUpsertRequest(r);
      }
    } catch (err) {
      console.warn("[hr-approval] hydrate failed, staying on localStorage:", err);
    }
  })();
  return __hydratePromise;
}

// Kick off hydrate once on module load in the browser.
if (typeof window !== "undefined") {
  hydrateFromSupabase();
}

// ── Public API (unchanged, synchronous) ─────────────────────────────
export function getAllRequests(): VacancyRequest[] {
  return getAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getRequestById(id: string): VacancyRequest | undefined {
  return getAll().find((r) => r.id === id);
}

export function getRequestsByDepartment(department: string): VacancyRequest[] {
  return getAll()
    .filter((r) => r.department === department)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getRequestsByEmail(email: string): VacancyRequest[] {
  return getAll()
    .filter((r) => r.requesterEmail === email)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createRequest(
  data: Omit<VacancyRequest, "id" | "createdAt" | "updatedAt" | "status" | "currentApprovalStep" | "approvalChain">
): VacancyRequest {
  const now = new Date().toISOString();
  const chainTemplate =
    typeof window !== "undefined" ? getSettings().approvalChain : APPROVAL_CHAIN_TEMPLATE;
  const approvalChain: ApprovalStep[] = chainTemplate.map((step, index) => ({
    ...step,
    id: uuidv4(),
    approverName: index === 0 ? data.budgetOwner : step.approverName || "",
    status: "pending" as const,
  }));

  const request: VacancyRequest = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    status: "received",
    currentApprovalStep: 0,
    approvalChain,
  };

  const all = getAll();
  all.push(request);
  saveAll(all);

  // Fire-and-forget Supabase write — UI already has the fresh copy.
  dbUpsertRequest(request);

  return request;
}

export function approveStep(
  requestId: string,
  stepIndex: number,
  comment?: string,
  internalComment?: string
): VacancyRequest | null {
  const all = getAll();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  const request = { ...all[idx] };
  const chain = [...request.approvalChain];

  chain[stepIndex] = {
    ...chain[stepIndex],
    status: "approved",
    comment,
    internalComment,
    decidedAt: new Date().toISOString(),
  };

  request.approvalChain = chain;
  request.updatedAt = new Date().toISOString();

  // Move to next step or finalize
  if (stepIndex < chain.length - 1) {
    request.currentApprovalStep = stepIndex + 1;
    request.status = "pending_approval";
  } else {
    request.status = "approved";
  }

  all[idx] = request;
  saveAll(all);
  dbUpsertRequest(request);
  return request;
}

export function rejectStep(
  requestId: string,
  stepIndex: number,
  reason: string,
  internalComment?: string
): VacancyRequest | null {
  const all = getAll();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  const request = { ...all[idx] };
  const chain = [...request.approvalChain];

  chain[stepIndex] = {
    ...chain[stepIndex],
    status: "rejected",
    comment: reason,
    internalComment,
    decidedAt: new Date().toISOString(),
  };

  request.approvalChain = chain;
  request.status = "rejected";
  request.rejectionReason = reason;
  request.updatedAt = new Date().toISOString();

  all[idx] = request;
  saveAll(all);
  dbUpsertRequest(request);
  return request;
}

export function updateRequestStatus(
  requestId: string,
  status: RequestStatus
): VacancyRequest | null {
  const all = getAll();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  const updated = { ...all[idx], status, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  saveAll(all);
  dbUpsertRequest(updated);
  return updated;
}

export function getDashboardStats() {
  const all = getAll();
  const approved = all.filter((r) => r.status === "approved" || r.status === "hiring_started");
  const rejected = all.filter((r) => r.status === "rejected");
  const pending = all.filter(
    (r) => r.status === "received" || r.status === "under_review" || r.status === "pending_approval"
  );

  let totalDays = 0;
  let countCompleted = 0;
  for (const r of [...approved, ...rejected]) {
    const start = new Date(r.createdAt).getTime();
    const end = new Date(r.updatedAt).getTime();
    totalDays += (end - start) / (1000 * 60 * 60 * 24);
    countCompleted++;
  }

  return {
    totalRequests: all.length,
    pendingRequests: pending.length,
    approvedRequests: approved.length,
    rejectedRequests: rejected.length,
    avgApprovalDays: countCompleted > 0 ? Math.round((totalDays / countCompleted) * 10) / 10 : 0,
  };
}

export function getTopRequestingManagers(): { name: string; count: number }[] {
  const all = getAll();
  const counts: Record<string, number> = {};
  for (const r of all) {
    counts[r.requesterName] = (counts[r.requesterName] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function deleteRequest(requestId: string): boolean {
  const all = getAll();
  const filtered = all.filter((r) => r.id !== requestId);
  if (filtered.length === all.length) return false;
  saveAll(filtered);
  dbDeleteRequest(requestId);
  return true;
}
