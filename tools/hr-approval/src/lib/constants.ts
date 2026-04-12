import { ApprovalStep } from "./types";

export const APPROVAL_CHAIN_TEMPLATE: Omit<ApprovalStep, "id">[] = [
  {
    order: 1,
    role: "المدير المباشر",
    approverName: "",
    approverEmail: "",
    slaHours: 24,
    status: "pending",
  },
  {
    order: 2,
    role: "الرئيس التنفيذي للإدارة",
    approverName: "",
    approverEmail: "",
    slaHours: 24,
    status: "pending",
  },
  {
    order: 3,
    role: "إدارة المواهب",
    approverName: "زكية حكمي",
    approverEmail: "zakiah@thmanyah.com",
    slaHours: 48,
    status: "pending",
  },
  {
    order: 4,
    role: "إدارة الثقافة",
    approverName: "البراء العوهلي",
    approverEmail: "albaraa@thmanyah.com",
    slaHours: 48,
    status: "pending",
  },
  {
    order: 5,
    role: "إدارة المالية",
    approverName: "ياسر الأحمد",
    approverEmail: "yasser@thmanyah.com",
    slaHours: 48,
    status: "pending",
  },
  {
    order: 6,
    role: "الرئيس التنفيذي",
    approverName: "عبدالرحمن أبومالح",
    approverEmail: "abdulrahman@thmanyah.com",
    slaHours: 48,
    status: "pending",
  },
];

export const STATUS_LABELS: Record<string, string> = {
  received: "استلمنا طلبك",
  under_review: "قيد المراجعة",
  pending_approval: "بانتظار الاعتماد",
  approved: "معتمد",
  rejected: "مرفوض",
  hiring_started: "بدأ التوظيف",
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  received: { bg: "bg-thmanyah-sky/20", text: "text-thmanyah-blue", dot: "bg-thmanyah-blue" },
  under_review: { bg: "bg-thmanyah-pale-yellow/40", text: "text-amber-700", dot: "bg-thmanyah-amber" },
  pending_approval: { bg: "bg-thmanyah-pale-yellow/40", text: "text-amber-700", dot: "bg-thmanyah-amber" },
  approved: { bg: "bg-thmanyah-green-light/30", text: "text-emerald-700", dot: "bg-thmanyah-green" },
  rejected: { bg: "bg-red-50", text: "text-red-700", dot: "bg-thmanyah-red" },
  hiring_started: { bg: "bg-thmanyah-green-light/30", text: "text-emerald-700", dot: "bg-thmanyah-green" },
};

export const DEPARTMENTS = [
  "الإنتاج",
  "البث",
  "المحتوى",
  "الأعمال",
  "التسويق",
  "المالية",
  "الثقافة",
  "التصميم",
  "التقنية",
  "المكتب التنفيذي",
  "العمليات",
];

export const JOB_LEVELS = [
  "مبتدئ (Junior)",
  "متوسط (Mid-level)",
  "أول (Senior)",
  "قائد فريق (Team Lead)",
  "مدير (Manager)",
  "مدير أول (Senior Manager)",
  "نائب رئيس (VP)",
  "رئيس تنفيذي (C-Level)",
];

export const ROLE_NATURES: { value: string; label: string }[] = [
  { value: "full_time", label: "دوام كامل" },
  { value: "part_time", label: "دوام جزئي" },
  { value: "contract", label: "عقد محدد المدة" },
  { value: "freelance", label: "مستقل (Freelance)" },
  { value: "intern", label: "متدرب" },
];

export const COUNTRIES = [
  "الرياض فقط",
  "السعودية فقط",
  "مرن جغرافيًا",
];

export const WORK_LOCATIONS = [
  { value: "remote", label: "عن بُعد" },
  { value: "onsite", label: "حضوري" },
];

export const INTRO_CHALLENGE =
  "طلبات التوظيف تسير بدون مرجعية واضحة للموافقات، خارج الهيكلة وخطة التوظيف، أو الميزانية. بالتالي، نواجه ترهل تنظيمي وتضخم غير صحي.";

export const INTRO_OPPORTUNITY =
  "نملك فرصة لإعادة ضبط التوظيف، تحسين جودة القرار، وبناء فرق استثنائية رشيقة لا تُبنى بالتوسع البشري المهول، بل بإدارة المواهب بكفاءة.";

export const HIRING_BAR_MESSAGE =
  "معايير ثمانية للنجاح ترتفع مع كل مشروع جديد. ومع كل تحول نمر به، معاييرنا بالأمس قد تتغير اليوم. ولكن، فكّر بصوت عالي بقرارات التوظيف السابقة التي اتّخذتها لمصلحة ثمانية.";

export const APPROVAL_FLOW_NOTE =
  "موافقة أبومالح المبدئية لا تُغني عن المرور بمسار الاعتماد الكامل.";

export const SLA_TOTAL = "5–10 أيام عمل لتقييم الطلب";
