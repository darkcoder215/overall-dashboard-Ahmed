/**
 * Seeds the system with demo requests at various workflow stages
 * so the user can explore tracking, approval, and dashboard interfaces.
 */

import { VacancyRequest, ApprovalStep } from "./types";
import { APPROVAL_CHAIN_TEMPLATE } from "./constants";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "thmanyah_vacancy_requests";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function buildChain(
  directManager: { name: string; email: string },
  deptCeo: { name: string; email: string },
  approvedUpTo: number,
  rejectedAt?: number,
): ApprovalStep[] {
  return APPROVAL_CHAIN_TEMPLATE.map((tpl, i) => {
    const step: ApprovalStep = {
      ...tpl,
      id: uuidv4(),
      approverName: i === 0 ? directManager.name : i === 1 ? deptCeo.name : tpl.approverName || "",
      approverEmail: i === 0 ? directManager.email : i === 1 ? deptCeo.email : tpl.approverEmail || "",
      status: "pending",
    };

    if (rejectedAt !== undefined && i === rejectedAt) {
      step.status = "rejected";
      step.decidedAt = hoursAgo((approvedUpTo - i) * 18);
      step.comment = REJECTION_COMMENTS[rejectedAt] || "غير مبرر كفاية";
    } else if (i < approvedUpTo) {
      step.status = "approved";
      step.decidedAt = hoursAgo((approvedUpTo - i) * 20);
      step.comment = APPROVAL_COMMENTS[i % APPROVAL_COMMENTS.length];
    }
    return step;
  });
}

const APPROVAL_COMMENTS = [
  "الطلب مبرر وواضح، موافق",
  "راجعنا التبرير والهيكلة — معتمد",
  "الحاجة واضحة، نحتاج نسرّع التوظيف",
  "موافق — يرجى مراعاة سلم الرواتب المعتمد",
  "الدور ضروري لاستمرارية العمل، معتمد",
  "معتمد بعد التأكد من توفر الميزانية",
];

const REJECTION_COMMENTS: Record<number, string> = {
  2: "الدور يتداخل مع صلاحيات فريق آخر. يرجى التنسيق مع إدارة العمليات أولاً.",
  3: "لا يتوافق مع خطة التوظيف المعتمدة للربع الحالي. يمكن إعادة التقديم الربع القادم.",
  4: "الميزانية المخصصة للإدارة مستنفدة. يرجى تقديم طلب إعادة تخصيص الميزانية أولاً.",
};

export function seedDemoData(): VacancyRequest[] {
  const requests: VacancyRequest[] = [
    // 1: Fully approved - hiring started
    {
      id: uuidv4(),
      createdAt: daysAgo(12),
      updatedAt: daysAgo(2),
      status: "approved",
      currentApprovalStep: 5,
      requesterName: "خالد العتيبي",
      requesterEmail: "khaled@thmanyah.com",
      department: "التقنية",
      section: "قسم الهندسة",
      team: "فريق المنصة",
      project: "إعادة بناء المنصة الرقمية",
      budgetOwner: "فهد السبيعي — الرئيس التنفيذي للتقنية",
      vacancyType: "new_position",
      positionsCount: 2,
      isInApprovedStructure: true,
      jobTitle: "مهندس برمجيات أول — Full Stack",
      jobTitleEn: "Senior Full Stack Software Engineer",
      jobLevel: "أول (Senior)",
      roleNature: "full_time",
      jobDescription: "تصميم وتطوير الحلول التقنية للمنصة الرقمية باستخدام Next.js و Node.js.\n\nالمهام الرئيسية:\n- قيادة تطوير الميزات الجديدة من التصميم إلى الإطلاق\n- مراجعة الكود وتوجيه المهندسين المبتدئين\n- تحسين أداء وموثوقية المنصة\n- التعاون مع فرق المنتج والتصميم",
      country: "السعودية فقط",
      workLocation: "onsite",
      nationality: "saudi",
      triedAlternatives: true,
      alternativesDescription: "جربنا توزيع المهام على الفريق الحالي لمدة 3 أشهر لكن الضغط أثر على جودة المخرجات.",
      risksIfNotHired: "تأخر إطلاق المنصة الرقمية الجديدة. زيادة الضغط على الفريق الحالي مما قد يؤدي لاستقالات.",
      aiRoleIntegration: "يمكن استخدام GitHub Copilot لتسريع كتابة الكود بنسبة 30-40%.",
      aiAutomationPotential: "يمكن أتمتة كتابة الاختبارات الوحدوية وتوثيق الكود.",
      aiReplacementAssessment: "لا يمكن استبداله في فهم سياق الأعمال والتصميم المعماري. العنصر البشري أساسي.",
      hiringBarCommitment: "نستهدف مهندس بخبرة 5+ سنوات مع سجل واضح في بناء منصات رقمية عالية الأداء.",
      approvalChain: buildChain(
        { name: "سعد الحربي", email: "saad@thmanyah.com" },
        { name: "فهد السبيعي", email: "fahad@thmanyah.com" },
        6
      ),
    },

    // 2: Pending at step 3 (Zakiah - Talent) — waiting for approval
    {
      id: uuidv4(),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
      status: "pending_approval",
      currentApprovalStep: 2,
      requesterName: "نورة القحطاني",
      requesterEmail: "noura@thmanyah.com",
      department: "الإنتاج",
      section: "قسم البودكاست",
      team: "فريق إنتاج البودكاست",
      project: "برنامج سوالف بزنس",
      budgetOwner: "عمر المالكي — الرئيس التنفيذي للإنتاج",
      vacancyType: "replacement",
      positionsCount: 1,
      previousEmployeeName: "محمد الشهري",
      departureDate: "2026-02-15",
      departureType: "resignation",
      departureReason: "قدم استقالته للانتقال لفرصة خارج المملكة. كان أداؤه ممتازًا وخروجه ترك فجوة واضحة.",
      jobTitle: "منتج بودكاست أول",
      jobTitleEn: "Senior Podcast Producer",
      jobLevel: "أول (Senior)",
      roleNature: "full_time",
      jobDescription: "إدارة عملية إنتاج البودكاست من الفكرة إلى النشر.\n\n- التنسيق مع المقدمين والضيوف\n- إدارة جلسات التسجيل\n- الإشراف على المونتاج والماسترنج\n- ضبط الجودة النهائية",
      country: "السعودية فقط",
      workLocation: "onsite",
      nationality: "saudi",
      triedAlternatives: false,
      risksIfNotHired: "توقف إنتاج حلقات برنامج سوالف بزنس أو انخفاض جودتها. خطر فقدان الجمهور.",
      aiRoleIntegration: "يمكن استخدام AI في تفريغ الحلقات تلقائيًا وتوليد ملخصات.",
      aiAutomationPotential: "المونتاج الأولي وإزالة الضوضاء يمكن أتمتتها جزئيًا.",
      aiReplacementAssessment: "لا يستطيع استبدال الحس الإبداعي والذوق الصوتي. العنصر البشري أساسي.",
      hiringBarCommitment: "منتج لديه محفظة أعمال مميزة في البودكاست العربي وخبرة 4+ سنوات.",
      approvalChain: buildChain(
        { name: "هند العنزي", email: "hind@thmanyah.com" },
        { name: "عمر المالكي", email: "omar@thmanyah.com" },
        2
      ),
    },

    // 3: Rejected at step 4 (Culture)
    {
      id: uuidv4(),
      createdAt: daysAgo(8),
      updatedAt: daysAgo(3),
      status: "rejected",
      currentApprovalStep: 3,
      requesterName: "ريم الدوسري",
      requesterEmail: "reem@thmanyah.com",
      department: "التسويق",
      section: "قسم التسويق الرقمي",
      team: "فريق النمو",
      project: "حملة إطلاق المنتج الجديد",
      budgetOwner: "سارة العمري — الرئيس التنفيذي للتسويق",
      vacancyType: "new_position",
      positionsCount: 1,
      isInApprovedStructure: false,
      structureJustification: "نحتاج هذا الدور مؤقتًا (6 أشهر) لدعم حملة إطلاق المنتج الجديد.",
      jobTitle: "مسؤول تسويق رقمي",
      jobTitleEn: "Digital Marketing Specialist",
      jobLevel: "متوسط (Mid-level)",
      roleNature: "contract",
      jobDescription: "إدارة الحملات الإعلانية الرقمية وتحسين معدلات التحويل.\n\n- إدارة حملات Google Ads و Meta Ads\n- تحليل أداء الحملات\n- إنشاء محتوى إعلاني\n- اختبارات A/B",
      country: "مرن جغرافيًا",
      workLocation: "remote",
      nationality: "arab",
      triedAlternatives: true,
      alternativesDescription: "تعاقدنا مع وكالة تسويق لمدة شهرين لكن النتائج كانت أقل من المتوقع.",
      risksIfNotHired: "تأخر حملة الإطلاق مما يؤثر على أهداف النمو للربع القادم.",
      aiRoleIntegration: "يمكن استخدام AI في كتابة نسخ إعلانية أولية وتحليل بيانات الحملات.",
      aiAutomationPotential: "تحليل البيانات وإعداد التقارير يمكن أتمتتها بنسبة كبيرة.",
      aiReplacementAssessment: "AI يمكنه دعم 40-50% من المهام التشغيلية لكن الاستراتيجية تحتاج العنصر البشري.",
      hiringBarCommitment: "شخص لديه خبرة مثبتة في حملات رقمية حققت نتائج ملموسة.",
      rejectionReason: "لا يتوافق مع خطة التوظيف المعتمدة للربع الحالي. يمكن إعادة التقديم الربع القادم.",
      approvalChain: buildChain(
        { name: "فاطمة الزهراني", email: "fatimah@thmanyah.com" },
        { name: "سارة العمري", email: "sarah@thmanyah.com" },
        3,
        3
      ),
    },

    // 4: Just received — step 0 (waiting for direct manager)
    {
      id: uuidv4(),
      createdAt: hoursAgo(6),
      updatedAt: hoursAgo(6),
      status: "received",
      currentApprovalStep: 0,
      requesterName: "عبدالله القرني",
      requesterEmail: "abdullah@thmanyah.com",
      department: "الإنتاج",
      section: "قسم البث",
      team: "فريق البث المباشر",
      project: "تغطيات الأحداث الحية",
      budgetOwner: "عمر المالكي — الرئيس التنفيذي للإنتاج",
      vacancyType: "replacement",
      positionsCount: 5,
      previousEmployeeName: "فريق البث السابق (5 أشخاص)",
      departureDate: "2026-01-30",
      departureType: "resignation",
      departureReason: "استقال 5 مهندسي بث بسبب عروض منافسة قدمت رواتب أعلى بنسبة 35-40%.",
      jobTitle: "مهندس بث مباشر",
      jobTitleEn: "Live Broadcast Engineer",
      jobLevel: "متوسط (Mid-level)",
      roleNature: "full_time",
      jobDescription: "إدارة وتشغيل البث المباشر للأحداث والبرامج.\n\n- تجهيز وتشغيل معدات البث\n- إدارة الصوت والصورة أثناء البث\n- حل المشاكل التقنية الطارئة",
      country: "السعودية فقط",
      workLocation: "onsite",
      nationality: "saudi",
      triedAlternatives: true,
      alternativesDescription: "استعنا بشركة إنتاج خارجية لكن التكلفة 3 أضعاف والجودة أقل.",
      risksIfNotHired: "عدم القدرة على تنفيذ أي بث مباشر مما يؤثر على 30% من المحتوى المخطط.",
      aiRoleIntegration: "يمكن استخدام AI في التبديل التلقائي بين الكاميرات وتحسين جودة الصورة.",
      aiAutomationPotential: "ضبط الإضاءة وتوازن الألوان يمكن أتمتتها لكن إدارة البث الحي تحتاج تدخل بشري.",
      aiReplacementAssessment: "يتطلب تواجد فيزيائي وتفاعل حي. لا يمكن للذكاء الاصطناعي استبداله.",
      hiringBarCommitment: "مهندسين لديهم خبرة في بث الأحداث الكبيرة مع حزمة تنافسية.",
      approvalChain: buildChain(
        { name: "ماجد الغامدي", email: "majed@thmanyah.com" },
        { name: "عمر المالكي", email: "omar@thmanyah.com" },
        0
      ),
    },

    // 5: Pending at step 5 (Finance) — almost done
    {
      id: uuidv4(),
      createdAt: daysAgo(9),
      updatedAt: daysAgo(1),
      status: "pending_approval",
      currentApprovalStep: 4,
      requesterName: "سلطان المطيري",
      requesterEmail: "sultan@thmanyah.com",
      department: "المحتوى",
      section: "قسم التحرير",
      team: "فريق المحتوى العربي",
      project: "توسيع المحتوى التحريري",
      budgetOwner: "أحمد الراشد — الرئيس التنفيذي للمحتوى",
      vacancyType: "new_position",
      positionsCount: 1,
      isInApprovedStructure: true,
      jobTitle: "محرر محتوى أول",
      jobTitleEn: "Senior Content Editor",
      jobLevel: "أول (Senior)",
      roleNature: "full_time",
      jobDescription: "إدارة وتحرير المحتوى التحريري لمنصات ثمانية الرقمية.\n\n- تحرير ومراجعة المقالات والتقارير\n- تطوير أفكار محتوى جديدة\n- التنسيق مع فريق التصميم\n- ضمان جودة اللغة والأسلوب",
      country: "السعودية فقط",
      workLocation: "onsite",
      nationality: "saudi",
      triedAlternatives: true,
      alternativesDescription: "استعنا بكتّاب مستقلين لكن الجودة غير متسقة والمتابعة صعبة.",
      risksIfNotHired: "عدم القدرة على تلبية خطة المحتوى للربع القادم. تراجع جودة المحتوى المنشور.",
      aiRoleIntegration: "AI يساعد في توليد الأفكار والمسودات الأولية وتدقيق النصوص.",
      aiAutomationPotential: "التدقيق اللغوي والتلخيص يمكن أتمتتها لكن التحرير الإبداعي يحتاج بشري.",
      aiReplacementAssessment: "الذوق التحريري وفهم صوت العلامة لا يمكن استبداله بالذكاء الاصطناعي.",
      hiringBarCommitment: "محرر بخبرة 5+ سنوات في المحتوى العربي الرقمي مع أمثلة منشورة.",
      approvalChain: buildChain(
        { name: "منيرة الحربي", email: "munirah@thmanyah.com" },
        { name: "أحمد الراشد", email: "ahmad@thmanyah.com" },
        4
      ),
    },

    // 6: Rejected at Finance (step 4) — budget issue
    {
      id: uuidv4(),
      createdAt: daysAgo(15),
      updatedAt: daysAgo(6),
      status: "rejected",
      currentApprovalStep: 4,
      requesterName: "لمى الشمري",
      requesterEmail: "lama@thmanyah.com",
      department: "المنتجات",
      section: "قسم تطوير المنتجات",
      team: "فريق تجربة المستخدم",
      project: "تطوير تطبيق ثمانية",
      budgetOwner: "هشام البلوشي — الرئيس التنفيذي للمنتجات",
      vacancyType: "new_position",
      positionsCount: 3,
      isInApprovedStructure: true,
      jobTitle: "مصمم تجربة مستخدم",
      jobTitleEn: "UX Designer",
      jobLevel: "متوسط (Mid-level)",
      roleNature: "full_time",
      jobDescription: "تصميم تجربة المستخدم لمنتجات ثمانية الرقمية.\n\n- إجراء بحوث المستخدمين\n- تصميم واجهات المستخدم\n- بناء النماذج الأولية\n- اختبار قابلية الاستخدام",
      country: "السعودية فقط",
      workLocation: "onsite",
      nationality: "arab",
      triedAlternatives: false,
      risksIfNotHired: "تأخر تطوير التطبيق وتراجع تجربة المستخدم مقارنة بالمنافسين.",
      aiRoleIntegration: "أدوات AI مثل Figma AI وMidjourney لتسريع التصميم.",
      aiAutomationPotential: "توليد التصاميم الأولية والأيقونات يمكن أتمتتها جزئيًا.",
      aiReplacementAssessment: "البحث مع المستخدمين وفهم السياق الثقافي يحتاج العنصر البشري بالكامل.",
      hiringBarCommitment: "مصمم بمحفظة أعمال قوية وخبرة في منتجات رقمية عربية.",
      rejectionReason: "الميزانية المخصصة للإدارة مستنفدة. يرجى تقديم طلب إعادة تخصيص الميزانية أولاً.",
      approvalChain: buildChain(
        { name: "عائشة النعيمي", email: "aisha@thmanyah.com" },
        { name: "هشام البلوشي", email: "hisham@thmanyah.com" },
        4,
        4
      ),
    },

    // 7: Pending at step 1 (Dept CEO)
    {
      id: uuidv4(),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
      status: "pending_approval",
      currentApprovalStep: 1,
      requesterName: "يوسف الحربي",
      requesterEmail: "yousef@thmanyah.com",
      department: "الأخبار",
      section: "قسم الأخبار العاجلة",
      team: "فريق التغطية",
      project: "توسيع التغطية الإخبارية",
      budgetOwner: "نايف العنزي — الرئيس التنفيذي للأخبار",
      vacancyType: "new_position",
      positionsCount: 2,
      isInApprovedStructure: true,
      jobTitle: "صحفي ميداني",
      jobTitleEn: "Field Journalist",
      jobLevel: "متوسط (Mid-level)",
      roleNature: "full_time",
      jobDescription: "تغطية الأحداث والأخبار العاجلة ميدانيًا.\n\n- التغطية الميدانية للأحداث\n- إعداد التقارير الإخبارية\n- إجراء المقابلات\n- التنسيق مع غرفة الأخبار",
      country: "السعودية فقط",
      workLocation: "onsite",
      nationality: "saudi",
      triedAlternatives: false,
      risksIfNotHired: "عدم القدرة على تغطية الأحداث المهمة وخسارة السبق الصحفي.",
      aiRoleIntegration: "AI يساعد في رصد الأخبار وتلخيص المصادر وترجمة المحتوى.",
      aiAutomationPotential: "رصد الأخبار والتلخيص يمكن أتمتتها لكن التغطية الميدانية تحتاج حضور بشري.",
      aiReplacementAssessment: "لا يمكن استبدال الحضور الميداني والتفاعل الإنساني مع مصادر الأخبار.",
      hiringBarCommitment: "صحفي بخبرة 3+ سنوات في التغطيات الميدانية وشبكة مصادر قوية.",
      approvalChain: buildChain(
        { name: "طارق السعدي", email: "tariq@thmanyah.com" },
        { name: "نايف العنزي", email: "nayef@thmanyah.com" },
        1
      ),
    },
  ];

  // Save to localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }

  return requests;
}

export function hasDemoData(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  const data = JSON.parse(raw);
  return data.length > 0;
}

export function clearAllData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
