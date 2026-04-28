"use client";

import { CandidateAnalysis } from "./types";
import { getAllCandidates, saveCandidate } from "./storage";

const DEMO_FLAG_KEY = "thmanyah_cv_demo_seeded_v1";

export const DEMO_CANDIDATES: CandidateAnalysis[] = [
  {
    id: "demo-leen-alqahtani",
    candidateName: "لين القحطاني",
    candidateEmail: "leen.q@example.com",
    roleContext: {
      roleTitle: "منتج محتوى صوتي أول",
      roleTitleEn: "Senior Audio Content Producer",
      department: "المحتوى",
      experienceLevel: "senior",
      requiredSkills: "إنتاج بودكاست، كتابة سكربت، مونتاج صوتي، إدارة ضيوف",
      roleDescription:
        "نبحث عن منتج محتوى صوتي أول لقيادة سلسلة بودكاست جديدة في ثمانية، مع مسؤولية كاملة عن السكربت والإنتاج وإدارة الحلقات.",
      niceToHaveSkills: "خبرة في تحرير الفيديو القصير، Adobe Audition",
      languageRequirements: "العربية والإنجليزية بطلاقة",
      additionalNotes: "العمل من الرياض بنظام هجين",
    },
    cvFileName: "Leen-AlQahtani-CV.pdf",
    videoFileName: "",
    status: "completed",
    decision: "strong_hire",
    cvAnalysis: {
      overallScore: 91,
      scoreLabel: "مرشح استثنائي",
      summary:
        "خبرة 7 سنوات في إنتاج البودكاست مع 3 سلاسل ناجحة تخطّت ملايين الاستماعات. أسلوب كتابة سكربت قوي ومعرفة عميقة بالمشهد العربي.",
      dimensions: [
        { name: "المهارات التقنية", nameEn: "Technical Skills", score: 23, maxScore: 25, detail: "إتقان واضح لـ Pro Tools و Audition، وتجربة سابقة بتصميم صوت أصلي للحلقات.", icon: "code" },
        { name: "الخبرة المهنية", nameEn: "Experience", score: 24, maxScore: 25, detail: "قادت سلسلة \"حكاية وشي\" من الإطلاق حتى 2 مليون مستمع شهرياً.", icon: "briefcase" },
        { name: "التعليم والشهادات", nameEn: "Education", score: 12, maxScore: 15, detail: "بكالوريوس إعلام من جامعة الملك سعود + شهادات BBC Sounds.", icon: "graduation-cap" },
        { name: "التوافق الثقافي", nameEn: "Cultural Fit", score: 19, maxScore: 20, detail: "اهتمام واضح بالصحافة الجادة والمحتوى العربي عالي الجودة.", icon: "heart" },
        { name: "جودة السيرة الذاتية", nameEn: "CV Quality", score: 13, maxScore: 15, detail: "منظمة وغنية بالأرقام والإنجازات القابلة للقياس.", icon: "file-text" },
      ],
      strengths: [
        "قيادة سلسلة من الصفر إلى ملايين الاستماعات",
        "شبكة علاقات قوية مع ضيوف من المنطقة",
        "حس صحفي واضح في اختيار القصص",
      ],
      concerns: [
        "لم تذكر تجربة مباشرة في إدارة فريق إنتاج كبير",
      ],
      experienceHighlights: [
        "منتجة أولى — استوديو صوت الرياض (2021–الآن)",
        "منتجة بودكاست — مؤسسة إعلامية إقليمية (2018–2021)",
      ],
      educationSummary: "بكالوريوس إعلام، جامعة الملك سعود (2017)، مع شهادات تخصصية من BBC Sounds وHarvard Online.",
      skillsMatch: "تطابق ممتاز مع كافة المهارات المطلوبة، مع أفضلية واضحة في كتابة السكربت.",
      recommendation:
        "مرشحة استثنائية، يُنصح بدعوتها للمقابلة النهائية مباشرة مع رئيس القسم. ركّزوا على رؤيتها لسلسلة جديدة وعلى قدرتها في القيادة.",
      suggestedQuestions: [
        "صفي لي عملية إطلاق سلسلة جديدة من الفكرة إلى الحلقة الأولى.",
        "كيف تبنين خط تحريري متماسك على مدى موسم كامل؟",
        "حدّثيني عن أصعب قرار إنتاجي اتخذتيه ولماذا؟",
      ],
    },
    videoAnalysis: null,
    combinedScore: 91,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "موعد المقابلة: الأربعاء القادم 4 عصراً.",
  },
  {
    id: "demo-yousef-almutairi",
    candidateName: "يوسف المطيري",
    candidateEmail: "yousef.m@example.com",
    roleContext: {
      roleTitle: "مطور واجهات أمامية",
      roleTitleEn: "Frontend Engineer",
      department: "التقنية",
      experienceLevel: "mid",
      requiredSkills: "React, TypeScript, Next.js, Tailwind",
      roleDescription:
        "نبحث عن مطور واجهات أمامية للانضمام لفريق المنصات الرقمية، يعمل على تطوير منتجات ثمانية الموجهة للمستخدم النهائي.",
      niceToHaveSkills: "خبرة في تصميم النظم (Design Systems)، أداء الواجهات",
      languageRequirements: "العربية والإنجليزية",
      additionalNotes: "",
    },
    cvFileName: "Yousef-AlMutairi-CV.pdf",
    videoFileName: "yousef-intro.mp4",
    status: "completed",
    decision: "hire",
    cvAnalysis: {
      overallScore: 76,
      scoreLabel: "مرشح قوي",
      summary:
        "مطور واجهات بخبرة 4 سنوات، خلفية صلبة في React وTypeScript، مع مساهمات في مشاريع مفتوحة المصدر. مناسب لمستوى متوسط مع إمكانية النمو.",
      dimensions: [
        { name: "المهارات التقنية", nameEn: "Technical Skills", score: 20, maxScore: 25, detail: "إتقان React/TypeScript واضح، Next.js على مستوى متوسط.", icon: "code" },
        { name: "الخبرة المهنية", nameEn: "Experience", score: 18, maxScore: 25, detail: "4 سنوات في شركتين ناشئتين، مشروعان منشوران للمستخدم النهائي.", icon: "briefcase" },
        { name: "التعليم والشهادات", nameEn: "Education", score: 11, maxScore: 15, detail: "بكالوريوس علوم حاسب من جامعة الملك فهد للبترول والمعادن.", icon: "graduation-cap" },
        { name: "التوافق الثقافي", nameEn: "Cultural Fit", score: 16, maxScore: 20, detail: "اهتمام معلن بالمحتوى الرقمي والإعلام، مدوّنة شخصية نشطة.", icon: "heart" },
        { name: "جودة السيرة الذاتية", nameEn: "CV Quality", score: 11, maxScore: 15, detail: "واضحة لكن تفتقد لأرقام محددة عن الأثر.", icon: "file-text" },
      ],
      strengths: [
        "خبرة فعلية في Next.js وReact Server Components",
        "مساهمات في مكتبات مفتوحة المصدر",
        "اهتمام شخصي بالأداء والـ accessibility",
      ],
      concerns: [
        "لا توجد خبرة موثقة في فرق تتجاوز 5 مهندسين",
        "غياب أرقام أداء/أثر في المشاريع السابقة",
      ],
      experienceHighlights: [
        "مهندس واجهات — منصة تجارة إلكترونية (2022–الآن)",
        "مطور واجهات مبتدئ — وكالة تقنية (2020–2022)",
      ],
      educationSummary: "بكالوريوس علوم حاسب، جامعة الملك فهد للبترول والمعادن (2020).",
      skillsMatch: "تطابق جيد مع أساسيات React/TypeScript، يحتاج لاختبار عملي للتحقق من Next.js على مستوى الإنتاج.",
      recommendation: "مرشح قوي للمستوى المتوسط، أنصح بالتقدم لمقابلة تقنية مع تحدي عملي مدته 90 دقيقة.",
      suggestedQuestions: [
        "احكِ عن أصعب مشكلة أداء واجهتها في مشروع React.",
        "كيف تنظم state معقد في تطبيق Next.js كبير؟",
        "ما رأيك في React Server Components من تجربتك؟",
      ],
    },
    videoAnalysis: {
      communicationScore: 78,
      confidenceScore: 72,
      clarityScore: 80,
      professionalismScore: 75,
      overallVideoScore: 76,
      summary: "تواصل واضح ومنطقي، ثقة متوسطة، أسلوب شرح مرتب. الخلفية بسيطة لكن مرتبة.",
      strengths: ["شرح تقني مبسط", "ترتيب أفكار جيد", "أمثلة عملية واضحة"],
      concerns: ["تواصل بصري محدود في النصف الأول", "بعض التردد عند الأسئلة المفتوحة"],
      bodyLanguageNotes: "وضعية مستقيمة، حركة يدين معتدلة، ابتسامة طبيعية في النهاية.",
      communicationStyle: "هادئ وودود، يميل للتفاصيل التقنية.",
      keyMoments: [
        "0:45 — شرح ممتاز لمعمارية أحد المشاريع السابقة",
        "2:10 — تردد ملحوظ عند سؤال \"لماذا ثمانية؟\"",
      ],
    },
    combinedScore: 76,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "",
  },
  {
    id: "demo-mariam-bensalem",
    candidateName: "مريم بن سالم",
    candidateEmail: "mariam.bs@example.com",
    roleContext: {
      roleTitle: "أخصائي تسويق محتوى",
      roleTitleEn: "Content Marketing Specialist",
      department: "التسويق",
      experienceLevel: "mid",
      requiredSkills: "تسويق محتوى، SEO، تحليلات، كتابة إعلانية",
      roleDescription:
        "أخصائي تسويق محتوى لقيادة استراتيجية النمو العضوي عبر القنوات الرقمية لثمانية.",
      niceToHaveSkills: "خبرة في إدارة الإعلانات المدفوعة",
      languageRequirements: "العربية والإنجليزية",
      additionalNotes: "",
    },
    cvFileName: "Mariam-BenSalem-CV.pdf",
    videoFileName: "",
    status: "completed",
    decision: "maybe",
    cvAnalysis: {
      overallScore: 62,
      scoreLabel: "مرشح محتمل",
      summary:
        "خبرة 3 سنوات في التسويق الرقمي بقطاع التجارة الإلكترونية. غياب خبرة قطاع الإعلام يجعلها فرصة محتملة تحتاج مقابلة لتقييم القابلية للتحول.",
      dimensions: [
        { name: "المهارات التقنية", nameEn: "Technical Skills", score: 16, maxScore: 25, detail: "أساسيات SEO وأدوات التحليل واضحة، لكن عمق متوسط.", icon: "code" },
        { name: "الخبرة المهنية", nameEn: "Experience", score: 14, maxScore: 25, detail: "3 سنوات، كلها في تجارة إلكترونية وليس في الإعلام.", icon: "briefcase" },
        { name: "التعليم والشهادات", nameEn: "Education", score: 10, maxScore: 15, detail: "بكالوريوس تسويق + شهادات Google Analytics و HubSpot.", icon: "graduation-cap" },
        { name: "التوافق الثقافي", nameEn: "Cultural Fit", score: 12, maxScore: 20, detail: "اهتمام معلن بالمحتوى لكن دون مؤشرات قوية على الإعلام.", icon: "heart" },
        { name: "جودة السيرة الذاتية", nameEn: "CV Quality", score: 10, maxScore: 15, detail: "مرتبة لكن تركز على المهام بدل الأثر.", icon: "file-text" },
      ],
      strengths: [
        "إتقان أدوات التحليل (GA4, Search Console)",
        "خلفية كتابية جيدة بالعربية",
        "حماس واضح للانتقال لقطاع الإعلام",
      ],
      concerns: [
        "غياب خبرة فعلية في الإعلام أو المحتوى الصحفي",
        "نتائج المشاريع السابقة موصوفة بدون أرقام واضحة",
      ],
      experienceHighlights: [
        "أخصائية تسويق رقمي — منصة تجارة إلكترونية (2022–الآن)",
        "مساعدة تسويق — وكالة إعلانات (2021–2022)",
      ],
      educationSummary: "بكالوريوس تسويق، جامعة الإمارات (2021) + شهادات HubSpot Inbound Marketing وGoogle Analytics.",
      skillsMatch: "تطابق متوسط؛ المهارات الأساسية موجودة لكن تطبيقها على محتوى إعلامي يحتاج تأكيد.",
      recommendation: "ندعوها لمقابلة استكشافية قصيرة (30 دقيقة) لتقييم القابلية الفعلية للانتقال إلى محتوى إعلامي.",
      suggestedQuestions: [
        "ما الذي يجذبك تحديداً للانتقال من التجارة الإلكترونية إلى الإعلام؟",
        "صفي حملة محتوى قمتِ بها من الفكرة حتى قياس النتيجة.",
        "كيف تختلف استراتيجيات نمو محتوى البودكاست عن منتج تجاري؟",
      ],
    },
    videoAnalysis: null,
    combinedScore: 62,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "",
  },
  {
    id: "demo-omar-shahid",
    candidateName: "عمر شاهد",
    candidateEmail: "omar.sh@example.com",
    roleContext: {
      roleTitle: "محرر فيديو",
      roleTitleEn: "Video Editor",
      department: "الإنتاج",
      experienceLevel: "junior",
      requiredSkills: "Premiere Pro, After Effects, تصحيح الألوان",
      roleDescription:
        "محرر فيديو لفريق الإنتاج، مسؤول عن مونتاج حلقات يوميّة قصيرة وحلقات طويلة شهرية.",
      niceToHaveSkills: "خبرة في الموشن جرافيك",
      languageRequirements: "العربية",
      additionalNotes: "",
    },
    cvFileName: "Omar-Shahid-CV.pdf",
    videoFileName: "",
    status: "completed",
    decision: "no_hire",
    cvAnalysis: {
      overallScore: 38,
      scoreLabel: "مرشح ضعيف",
      summary:
        "خبرة محدودة جداً (أقل من سنة) ومعظمها في مشاريع شخصية صغيرة. لا تتوفر شواهد على إتقان الأدوات المطلوبة على مستوى احترافي.",
      dimensions: [
        { name: "المهارات التقنية", nameEn: "Technical Skills", score: 9, maxScore: 25, detail: "ذكر الأدوات بشكل عام دون أمثلة عملية محددة.", icon: "code" },
        { name: "الخبرة المهنية", nameEn: "Experience", score: 7, maxScore: 25, detail: "أقل من 12 شهراً ومن مشاريع شخصية أو حر بسيطة.", icon: "briefcase" },
        { name: "التعليم والشهادات", nameEn: "Education", score: 6, maxScore: 15, detail: "دبلوم تصوير من معهد محلي، دون شهادات تخصصية في المونتاج.", icon: "graduation-cap" },
        { name: "التوافق الثقافي", nameEn: "Cultural Fit", score: 9, maxScore: 20, detail: "اهتمام عام بالفيديو لكن بدون أمثلة على ذوق إعلامي محدد.", icon: "heart" },
        { name: "جودة السيرة الذاتية", nameEn: "CV Quality", score: 7, maxScore: 15, detail: "مختصرة جداً، تنقصها التفاصيل.", icon: "file-text" },
      ],
      strengths: [
        "حماس واضح للمجال",
      ],
      concerns: [
        "خبرة عملية محدودة جداً",
        "غياب نماذج أعمال مرفقة (Showreel)",
        "لا توجد شواهد على العمل تحت ضغط مواعيد يومية",
      ],
      experienceHighlights: [
        "مونتير حر — مشاريع شخصية (2024–الآن)",
      ],
      educationSummary: "دبلوم تصوير، معهد محلي (2024).",
      skillsMatch: "أقل من المطلوب لمستوى مبتدئ في بيئة إنتاج يومية.",
      recommendation: "غير مناسب لهذا الدور الآن. يمكن إعادة النظر بعد سنة من الخبرة المثبتة + Showreel متكامل.",
      suggestedQuestions: [
        "هل لديك نماذج أعمال (Showreel) يمكن مشاهدتها؟",
        "كم حلقة متوسطة الطول أنجزت من البداية للنهاية؟",
      ],
    },
    videoAnalysis: null,
    combinedScore: 38,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "",
  },
];

export function seedDemoCandidatesIfEmpty(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(DEMO_FLAG_KEY) === "1") return false;
  if (getAllCandidates().length > 0) {
    localStorage.setItem(DEMO_FLAG_KEY, "1");
    return false;
  }
  for (const c of DEMO_CANDIDATES) saveCandidate(c);
  localStorage.setItem(DEMO_FLAG_KEY, "1");
  return true;
}
