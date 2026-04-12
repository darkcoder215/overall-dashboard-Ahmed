/**
 * Settings store — persists admin customizations in localStorage.
 * Falls back to constants.ts defaults when no overrides exist.
 */

import {
  DEPARTMENTS,
  JOB_LEVELS,
  ROLE_NATURES,
  COUNTRIES,
  APPROVAL_CHAIN_TEMPLATE,
  INTRO_CHALLENGE,
  INTRO_OPPORTUNITY,
  HIRING_BAR_MESSAGE,
  APPROVAL_FLOW_NOTE,
  SLA_TOTAL,
} from "./constants";
import { ApprovalStep } from "./types";

const SETTINGS_KEY = "thmanyah_settings";

export interface ApprovalStepConfig {
  order: number;
  role: string;
  approverName: string;
  approverEmail: string;
  slaHours: number;
}

export interface AppSettings {
  // Dropdown options
  departments: string[];
  jobLevels: string[];
  roleNatures: { value: string; label: string }[];
  countries: string[];

  // Approval chain
  approvalChain: ApprovalStepConfig[];

  // Messaging
  introChallenge: string;
  introOpportunity: string;
  hiringBarMessage: string;
  approvalFlowNote: string;
  slaTotal: string;
}

export function getDefaultSettings(): AppSettings {
  return {
    departments: [...DEPARTMENTS],
    jobLevels: [...JOB_LEVELS],
    roleNatures: ROLE_NATURES.map((r) => ({ ...r })),
    countries: [...COUNTRIES],
    approvalChain: APPROVAL_CHAIN_TEMPLATE.map((s) => ({
      order: s.order,
      role: s.role,
      approverName: s.approverName,
      approverEmail: s.approverEmail,
      slaHours: s.slaHours,
    })),
    introChallenge: INTRO_CHALLENGE,
    introOpportunity: INTRO_OPPORTUNITY,
    hiringBarMessage: HIRING_BAR_MESSAGE,
    approvalFlowNote: APPROVAL_FLOW_NOTE,
    slaTotal: SLA_TOTAL,
  };
}

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return getDefaultSettings();
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return getDefaultSettings();
  try {
    const saved = JSON.parse(raw) as Partial<AppSettings>;
    // Merge with defaults to handle new fields added later
    const defaults = getDefaultSettings();
    return { ...defaults, ...saved };
  } catch {
    return getDefaultSettings();
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function resetSettings(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SETTINGS_KEY);
}

export function hasCustomSettings(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SETTINGS_KEY) !== null;
}
