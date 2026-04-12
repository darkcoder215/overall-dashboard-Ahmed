import { CandidateAnalysis, CandidateDecision } from "./types";

const STORAGE_KEY = "thmanyah_cv_analyses";

export function getAllCandidates(): CandidateAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CandidateAnalysis[];
  } catch {
    return [];
  }
}

export function getCandidate(id: string): CandidateAnalysis | null {
  const all = getAllCandidates();
  return all.find((c) => c.id === id) || null;
}

export function saveCandidate(candidate: CandidateAnalysis): void {
  const all = getAllCandidates();
  const idx = all.findIndex((c) => c.id === candidate.id);
  if (idx >= 0) {
    all[idx] = { ...candidate, updatedAt: new Date().toISOString() };
  } else {
    all.unshift(candidate);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteCandidate(id: string): void {
  const all = getAllCandidates().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function updateDecision(id: string, decision: CandidateDecision): void {
  const all = getAllCandidates();
  const idx = all.findIndex((c) => c.id === id);
  if (idx >= 0) {
    all[idx].decision = decision;
    all[idx].updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

export function getStats() {
  const all = getAllCandidates();
  const completed = all.filter((c) => c.status === "completed");
  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((sum, c) => sum + c.combinedScore, 0) / completed.length)
      : 0;
  const topCandidate = completed.sort((a, b) => b.combinedScore - a.combinedScore)[0] || null;
  const decisions = {
    strong_hire: all.filter((c) => c.decision === "strong_hire").length,
    hire: all.filter((c) => c.decision === "hire").length,
    maybe: all.filter((c) => c.decision === "maybe").length,
    no_hire: all.filter((c) => c.decision === "no_hire").length,
    pending: all.filter((c) => c.decision === "pending").length,
  };

  return {
    total: all.length,
    completed: completed.length,
    analyzing: all.filter((c) => c.status === "analyzing").length,
    avgScore,
    topCandidate,
    decisions,
  };
}
