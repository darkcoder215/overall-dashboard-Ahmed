import { ExperienceLevel, CandidateDecision } from "./types";

export const DEPARTMENTS = [
  "الإنتاج",
  "البث",
  "المحتوى",
  "التقنية",
  "التسويق",
  "المالية",
  "الموارد البشرية",
  "العمليات",
  "المبيعات",
  "التصميم",
  "البيانات والذكاء الاصطناعي",
  "أخرى",
];

export const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "intern", label: "متدرب" },
  { value: "junior", label: "مبتدئ" },
  { value: "mid", label: "متوسط" },
  { value: "senior", label: "متقدم" },
  { value: "lead", label: "قائد فريق" },
  { value: "manager", label: "مدير" },
  { value: "director", label: "مدير إدارة" },
  { value: "executive", label: "تنفيذي" },
];

export const DECISION_CONFIG: Record<
  CandidateDecision,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  strong_hire: {
    label: "توظيف فوري",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  hire: {
    label: "توظيف",
    color: "text-thmanyah-green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  maybe: {
    label: "مقابلة إضافية",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  no_hire: {
    label: "غير مناسب",
    color: "text-thmanyah-red",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  pending: {
    label: "قيد المراجعة",
    color: "text-thmanyah-muted",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

export function getScoreLabel(score: number): string {
  if (score >= 85) return "مرشح استثنائي";
  if (score >= 70) return "مرشح قوي";
  if (score >= 55) return "مرشح محتمل";
  if (score >= 40) return "مرشح ضعيف";
  return "غير مناسب";
}

export function getScoreColor(score: number): string {
  if (score >= 85) return "#00C17A";
  if (score >= 70) return "#B2E2BA";
  if (score >= 55) return "#FFBC0A";
  if (score >= 40) return "#FF9172";
  return "#F24935";
}

export const MAX_CV_SIZE_MB = 10;
export const MAX_VIDEO_SIZE_MB = 50;
export const ACCEPTED_CV_TYPES = [".pdf", ".doc", ".docx"];
export const ACCEPTED_VIDEO_TYPES = [".mp4", ".mov", ".webm", ".avi"];
