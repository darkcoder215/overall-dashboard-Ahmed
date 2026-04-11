// Static fallback registry — used when Supabase is unreachable or the
// user is not signed in. Keep this in sync with the `public.tools` table
// in Supabase (migration `init_tools_registry`).
export const STATIC_TOOLS = [
  {
    slug: 'commentator',
    name_ar: 'أداة تحليل المعلقين',
    name_en: 'Commentator Analysis',
    description_ar: 'تحليل أداء المعلقين الرياضيين عبر 32 معيارًا مهنيًا عبر 8 محاور مع تقارير PDF.',
    category: 'analytics',
    icon: 'mic',
    url: '/commentator/',
    enabled: true,
    position: 10,
  },
  {
    slug: 'social-listening',
    name_ar: 'أداة الرصد الاجتماعي',
    name_en: 'Social Listening',
    description_ar: 'رصد المحتوى الاجتماعي، تحليل التغريدات، واصطياد المرشحين عبر LinkedIn وApify.',
    category: 'social',
    icon: 'radio',
    url: '/social-listening/',
    enabled: true,
    position: 20,
  },
  {
    slug: 'chatbot',
    name_ar: 'مساعد ثمانية الذكي',
    name_en: 'Thmanyah AI Assistant',
    description_ar: 'مساعد ذكي يجيب على أسئلة السياسات والمعلومات عبر استرجاع المستندات (RAG).',
    category: 'ai',
    icon: 'message-square',
    url: '/chatbot/',
    enabled: true,
    position: 30,
  },
  {
    slug: 'podcast-video',
    name_ar: 'أداة تحليل البودكاست',
    name_en: 'Podcast & Video Analysis',
    description_ar: 'رفع البودكاست والفيديو، توليد التفريغات النصية، والبحث داخلها.',
    category: 'content',
    icon: 'video',
    url: '/podcast-video/',
    enabled: true,
    position: 40,
  },
  {
    slug: 'hr-approval',
    name_ar: 'نموذج طلب فتح شاغر وظيفي',
    name_en: 'HR Approval Workflow',
    description_ar: 'إدارة طلبات فتح الوظائف الشاغرة وتوجيهها في سلسلة الاعتماد.',
    category: 'hr',
    icon: 'clipboard-check',
    url: '/hr-approval/',
    enabled: true,
    position: 50,
  },
  {
    slug: 'feedback-platform',
    name_ar: 'منصة تحليل التقييمات',
    name_en: 'Feedback Analysis',
    description_ar: 'تحليل تقييمات الموظفين، فترات التجربة، وتقييمات القادة مع لوحات بيانية.',
    category: 'hr',
    icon: 'bar-chart-3',
    url: '/feedback-platform/',
    enabled: true,
    position: 60,
  },
];

// Map of Lucide icon name → inline SVG path markup. Only the icons the
// registry actually uses are bundled — add more here if you add tools
// that need other icons.
export const ICONS = {
  mic: `<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>`,
  radio: `<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>`,
  'message-square': `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
  video: `<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>`,
  'clipboard-check': `<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/>`,
  'bar-chart-3': `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
  'layout-grid': `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`,
};

export const CATEGORY_LABELS = {
  analytics: 'تحليل',
  hr: 'موارد بشرية',
  content: 'محتوى',
  ai: 'ذكاء اصطناعي',
  social: 'اجتماعي',
  general: 'عام',
};

// Per-tool accent — drives the glow colour on each tool card. Keys are
// tool slugs; values are keywords consumed by [data-accent] CSS rules
// in styles.css.
export const TOOL_ACCENTS = {
  'commentator':        'amber',
  'chatbot':            'blue',
  'social-listening':   'peach',
  'podcast-video':      'red',
  'hr-approval':        'green',
  'feedback-platform':  'charcoal',
};
