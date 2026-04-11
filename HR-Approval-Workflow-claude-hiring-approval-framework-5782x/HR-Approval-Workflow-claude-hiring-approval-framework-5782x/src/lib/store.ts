/**
 * Local store for MVP — works without Supabase.
 * Data persists in localStorage so the tool is functional standalone.
 * When Supabase is configured, this can be swapped for real DB calls.
 */

import { VacancyRequest, ApprovalStep, RequestStatus } from "./types";
import { APPROVAL_CHAIN_TEMPLATE } from "./constants";
import { getSettings } from "./settings";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "thmanyah_vacancy_requests";

function getAll(): VacancyRequest[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveAll(requests: VacancyRequest[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

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
  const chainTemplate = typeof window !== "undefined" ? getSettings().approvalChain : APPROVAL_CHAIN_TEMPLATE;
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
  return request;
}

export function updateRequestStatus(
  requestId: string,
  status: RequestStatus
): VacancyRequest | null {
  const all = getAll();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString() };
  saveAll(all);
  return all[idx];
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
  return true;
}
