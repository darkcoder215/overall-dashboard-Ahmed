import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

export function timeAgo(dateStr: string) {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  return `منذ ${months} شهر`;
}

export function getScoreColor(score: number) {
  if (score >= 85) return "#00C17A";
  if (score >= 70) return "#0072F9";
  if (score >= 50) return "#FFBC0A";
  return "#F24935";
}

export function getStageColor(category: string) {
  const colors: Record<string, string> = {
    apply: "#0072F9",
    phone_screen: "#84DBE5",
    interview: "#FFBC0A",
    evaluation: "#FF9172",
    offer: "#B2E2BA",
    hire: "#00C17A",
    disqualified: "#F24935",
    none: "#494C6B",
  };
  return colors[category] || "#494C6B";
}
