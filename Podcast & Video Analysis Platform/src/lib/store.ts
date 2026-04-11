import { Podcast, Scene, SceneMetrics, ChatMessage, SearchResult, SceneMetadata, PodcastData, PipelineStatus, EmbeddingVector } from '@/types';

// In-memory store for demo purposes
// In production, replace with Supabase or similar

const defaultMetrics: SceneMetrics = {
  minDuration: 30,
  maxDuration: 300,
  topicChangeThreshold: 0.7,
  silenceThreshold: 2,
  mergeShortSegments: true,
  splitLongSegments: true,
};

const demoPodcasts: Podcast[] = [
  {
    id: '1',
    title: 'سوالف بزنس - ريادة الأعمال في السعودية',
    description: 'حلقة شاملة تستعرض رحلة ريادة الأعمال في المملكة العربية السعودية من البدايات المتواضعة إلى رؤية 2030، مع نصائح عملية للشباب وتحليل عميق لتحديات السوق والفرص المتاحة',
    duration: '45:30',
    uploadDate: '2026-03-28',
    status: 'ready',
    scenesCount: 8,
    source: 'upload',
  },
  {
    id: '2',
    title: 'فنجان - مستقبل التقنية والذكاء الاصطناعي',
    description: 'حوار معمّق يستكشف تأثير الذكاء الاصطناعي والتحول الرقمي على سوق العمل السعودي والمجتمع، مع استعراض لأحدث التطورات في مجال الروبوتات والأتمتة وأخلاقيات الذكاء الاصطناعي',
    duration: '62:15',
    uploadDate: '2026-03-25',
    status: 'ready',
    scenesCount: 10,
    source: 'transcript',
  },
  {
    id: '3',
    title: 'سوالف بزنس - التسويق الرقمي',
    description: 'دليل شامل لاستراتيجيات التسويق الرقمي الحديثة للشركات الناشئة في المنطقة العربية، يشمل التسويق بالمحتوى والتسويق عبر المؤثرين وقياس العائد على الاستثمار',
    duration: '38:45',
    uploadDate: '2026-03-20',
    status: 'ready',
    scenesCount: 7,
    source: 'video-url',
  },
];

const demoScenes: Scene[] = [
  {
    id: 's1',
    podcastId: '1',
    title: 'المقدمة والترحيب',
    startTime: '00:00',
    endTime: '03:45',
    content: 'مرحباً بكم في حلقة جديدة من سوالف بزنس. اليوم نتحدث عن ريادة الأعمال في السعودية مع ضيفنا المميز الذي سيشاركنا تجربته الفريدة في عالم الشركات الناشئة.',
    summary: 'ترحيب بالمستمعين وتعريف بموضوع الحلقة والضيف',
    topics: ['مقدمة', 'ترحيب'],
    mood: 'ودّي',
    order: 1,
  },
  {
    id: 's2',
    podcastId: '1',
    title: 'قصة البداية',
    startTime: '03:45',
    endTime: '12:30',
    content: 'بدأت رحلتي في ريادة الأعمال عندما كنت طالباً جامعياً. لاحظت أن هناك فجوة كبيرة في السوق السعودي، خصوصاً في مجال التقنية. قررت أن أبدأ مشروعي الأول بميزانية محدودة جداً وبمساعدة بعض الأصدقاء.',
    summary: 'الضيف يروي قصة بدايته في ريادة الأعمال أثناء دراسته الجامعية',
    topics: ['بدايات', 'ريادة أعمال', 'تقنية'],
    mood: 'ملهم',
    order: 2,
  },
  {
    id: 's3',
    podcastId: '1',
    title: 'التحديات والعقبات',
    startTime: '12:30',
    endTime: '22:00',
    content: 'أكبر تحدٍ واجهته كان إقناع المستثمرين بفكرتي. في ذلك الوقت، لم يكن النظام البيئي لريادة الأعمال في السعودية متطوراً كما هو اليوم. كنت أحتاج إلى إثبات أن هناك سوقاً حقيقياً لمنتجي.',
    summary: 'مناقشة التحديات الرئيسية التي واجهها في مسيرته وكيفية التغلب عليها',
    topics: ['تحديات', 'استثمار', 'نظام بيئي'],
    mood: 'جدّي',
    order: 3,
  },
  {
    id: 's4',
    podcastId: '1',
    title: 'دور رؤية 2030',
    startTime: '22:00',
    endTime: '30:15',
    content: 'رؤية 2030 غيّرت المشهد بالكامل. أصبح هناك دعم حكومي حقيقي لرواد الأعمال من خلال برامج مثل منشآت وصندوق الصناديق. هذا الدعم ساعد في جذب استثمارات أجنبية كبيرة للسوق السعودي.',
    summary: 'تأثير رؤية 2030 على بيئة ريادة الأعمال والدعم الحكومي',
    topics: ['رؤية 2030', 'دعم حكومي', 'استثمارات'],
    mood: 'متفائل',
    order: 4,
  },
  {
    id: 's5',
    podcastId: '1',
    title: 'نصائح لرواد الأعمال الشباب',
    startTime: '30:15',
    endTime: '38:00',
    content: 'نصيحتي الأولى هي أن تبدأ صغيراً وتتعلم من أخطائك. لا تنتظر حتى يكون كل شيء مثالياً. السوق السعودي مليء بالفرص، لكن عليك أن تكون مستعداً للعمل بجد والتكيف بسرعة مع المتغيرات.',
    summary: 'نصائح عملية للشباب الراغبين في دخول عالم ريادة الأعمال',
    topics: ['نصائح', 'شباب', 'فرص'],
    mood: 'تحفيزي',
    order: 5,
  },
  {
    id: 's6',
    podcastId: '1',
    title: 'المستقبل والخطط القادمة',
    startTime: '38:00',
    endTime: '43:00',
    content: 'نخطط للتوسع في منطقة الخليج خلال العامين القادمين. نعمل أيضاً على تطوير منتجات جديدة تستخدم الذكاء الاصطناعي لتحسين تجربة المستخدم وتقديم حلول مبتكرة.',
    summary: 'خطط التوسع المستقبلية واستخدام التقنيات الحديثة',
    topics: ['توسع', 'ذكاء اصطناعي', 'خطط مستقبلية'],
    mood: 'طموح',
    order: 6,
  },
  {
    id: 's7',
    podcastId: '1',
    title: 'أسئلة المستمعين',
    startTime: '43:00',
    endTime: '44:30',
    content: 'سؤال من أحد المستمعين: كيف أختار الشريك المؤسس المناسب؟ هذا سؤال مهم جداً. أنصح بالبحث عن شخص يكمّل مهاراتك وليس شخصاً مطابقاً لك في التفكير.',
    summary: 'إجابة على أسئلة المستمعين حول اختيار الشريك المؤسس',
    topics: ['أسئلة', 'شراكة', 'فريق عمل'],
    mood: 'تفاعلي',
    order: 7,
  },
  {
    id: 's8',
    podcastId: '1',
    title: 'الخاتمة',
    startTime: '44:30',
    endTime: '45:30',
    content: 'شكراً لضيفنا على هذا الحوار الممتع والمفيد. نتمنى أن تكونوا قد استفدتم من هذه الحلقة. لا تنسوا الاشتراك في البودكاست ومشاركة آرائكم معنا.',
    summary: 'شكر الضيف والمستمعين وختام الحلقة',
    topics: ['خاتمة', 'شكر'],
    mood: 'ودّي',
    order: 8,
  },
];

const demoScenes2: Scene[] = [
  {
    id: 's2-1',
    podcastId: '2',
    title: 'مقدمة: عصر الذكاء الاصطناعي',
    startTime: '00:00',
    endTime: '05:20',
    content: 'أهلاً وسهلاً بكم في حلقة جديدة من فنجان. اليوم نتحدث عن موضوع يشغل العالم بأسره: الذكاء الاصطناعي ومستقبل التقنية. معنا ضيف متخصص في علوم الحاسب والذكاء الاصطناعي سيشاركنا رؤيته لما ينتظرنا في السنوات القادمة.',
    summary: 'تقديم الحلقة والضيف المتخصص في الذكاء الاصطناعي',
    topics: ['مقدمة', 'ذكاء اصطناعي'],
    mood: 'ودّي',
    order: 1,
  },
  {
    id: 's2-2',
    podcastId: '2',
    title: 'ثورة النماذج اللغوية الكبيرة',
    startTime: '05:20',
    endTime: '15:00',
    content: 'ما حصل مع ChatGPT كان نقطة تحول حقيقية. النماذج اللغوية الكبيرة أصبحت قادرة على فهم اللغة البشرية والتفاعل معها بطريقة لم نكن نتخيلها. الفرق بين 2020 و2026 هائل، والتطور متسارع بشكل غير مسبوق في تاريخ التقنية.',
    summary: 'استعراض التطور السريع في النماذج اللغوية الكبيرة وتأثيرها على حياتنا اليومية',
    topics: ['نماذج لغوية', 'ChatGPT', 'تعلم آلي'],
    mood: 'متحمّس',
    order: 2,
  },
  {
    id: 's2-3',
    podcastId: '2',
    title: 'تأثير الذكاء الاصطناعي على سوق العمل',
    startTime: '15:00',
    endTime: '25:30',
    content: 'الدراسات تشير إلى أن 40% من الوظائف الحالية ستتأثر بشكل مباشر خلال العقد القادم. لكن هذا لا يعني بالضرورة فقدان الوظائف، بل تحولها. الموظف الذي يستخدم الذكاء الاصطناعي سيحل محل الموظف الذي لا يستخدمه. في السعودية، نحتاج برامج إعادة تأهيل مهني ضخمة.',
    summary: 'تحليل تأثير الأتمتة والذكاء الاصطناعي على الوظائف الحالية والمستقبلية في السوق السعودي',
    topics: ['سوق عمل', 'أتمتة', 'وظائف', 'تأهيل مهني'],
    mood: 'جدّي',
    order: 3,
  },
  {
    id: 's2-4',
    podcastId: '2',
    title: 'التعليم والمناهج الجديدة',
    startTime: '25:30',
    endTime: '34:00',
    content: 'نظامنا التعليمي يحتاج ثورة حقيقية. لا يكفي أن نضيف مادة البرمجة في المناهج. نحتاج أن نعلّم أطفالنا التفكير النقدي وحل المشكلات والإبداع. هذه المهارات هي التي لن يستطيع الذكاء الاصطناعي استبدالها. بعض الجامعات السعودية بدأت بتحديث برامجها، لكن الطريق لا يزال طويلاً.',
    summary: 'مناقشة ضرورة إصلاح النظام التعليمي لمواكبة عصر الذكاء الاصطناعي',
    topics: ['تعليم', 'مناهج', 'برمجة', 'تفكير نقدي'],
    mood: 'تحليلي',
    order: 4,
  },
  {
    id: 's2-5',
    podcastId: '2',
    title: 'الذكاء الاصطناعي في القطاع الصحي',
    startTime: '34:00',
    endTime: '42:15',
    content: 'القطاع الصحي من أكثر المستفيدين. تخيل نظام يستطيع تشخيص الأمراض من صور الأشعة بدقة تفوق أفضل الأطباء. في السعودية، بدأنا نرى تطبيقات الطب عن بعد والتشخيص الذكي. شركة سعودية ناشئة طورت نظاماً يكشف سرطان الثدي مبكراً بدقة 97%.',
    summary: 'استعراض تطبيقات الذكاء الاصطناعي في مجال الرعاية الصحية والتشخيص الطبي',
    topics: ['صحة', 'تشخيص', 'طب عن بعد', 'ابتكار طبي'],
    mood: 'متفائل',
    order: 5,
  },
  {
    id: 's2-6',
    podcastId: '2',
    title: 'أخلاقيات الذكاء الاصطناعي',
    startTime: '42:15',
    endTime: '50:00',
    content: 'مسألة الأخلاقيات والخصوصية تحتاج نقاشاً جاداً. من يتحمل المسؤولية عندما يخطئ نظام ذكاء اصطناعي في التشخيص الطبي؟ ماذا عن التحيز في البيانات؟ النماذج المدربة على بيانات غربية قد لا تعكس واقعنا العربي. نحتاج تنظيماً واضحاً يحمي الأفراد دون أن يعيق الابتكار.',
    summary: 'مناقشة التحديات الأخلاقية المتعلقة بالخصوصية والتحيز والمسؤولية في أنظمة الذكاء الاصطناعي',
    topics: ['أخلاقيات', 'خصوصية', 'تحيز', 'تنظيم'],
    mood: 'جدّي',
    order: 6,
  },
  {
    id: 's2-7',
    podcastId: '2',
    title: 'الروبوتات والأتمتة',
    startTime: '50:00',
    endTime: '55:30',
    content: 'مشروع نيوم يتضمن خططاً طموحة لاستخدام الروبوتات في الخدمات والبناء. نحن نتحدث عن مدينة ذكية بالكامل. المصانع السعودية بدأت تتبنى الأتمتة، وهذا يزيد الإنتاجية بنسبة 30 إلى 50% في بعض القطاعات.',
    summary: 'استعراض مشاريع الروبوتات والأتمتة في السعودية وخاصة مشروع نيوم',
    topics: ['روبوتات', 'نيوم', 'أتمتة', 'مدن ذكية'],
    mood: 'متحمّس',
    order: 7,
  },
  {
    id: 's2-8',
    podcastId: '2',
    title: 'الاستثمار في التقنية السعودية',
    startTime: '55:30',
    endTime: '59:00',
    content: 'الرياض أصبحت مركزاً إقليمياً للشركات التقنية الناشئة. حجم الاستثمارات في القطاع التقني السعودي تضاعف 5 مرات خلال السنوات الخمس الأخيرة. بعض الشركات السعودية أصبحت تنافس شركات وادي السيليكون في مجالات محددة.',
    summary: 'تحليل نمو قطاع الاستثمار التقني في السعودية ومقارنته بالأسواق العالمية',
    topics: ['استثمار', 'شركات ناشئة', 'رياض', 'تقنية'],
    mood: 'متفائل',
    order: 8,
  },
  {
    id: 's2-9',
    podcastId: '2',
    title: 'نظرة مستقبلية: 2030 وما بعدها',
    startTime: '59:00',
    endTime: '61:00',
    content: 'بحلول 2030، أتوقع أن يكون لكل شخص مساعد ذكاء اصطناعي شخصي يدير حياته اليومية. التعليم سيصبح مخصصاً بالكامل لكل طالب. القيادة الذاتية ستكون أمراً عادياً. السعودية في موقع ممتاز لقيادة هذا التحول في المنطقة بفضل رؤية 2030 والاستثمارات الضخمة.',
    summary: 'توقعات مستقبلية حول تأثير الذكاء الاصطناعي على الحياة اليومية بحلول 2030',
    topics: ['مستقبل', 'رؤية 2030', 'تحول رقمي', 'توقعات'],
    mood: 'طموح',
    order: 9,
  },
  {
    id: 's2-10',
    podcastId: '2',
    title: 'الخاتمة والتوصيات',
    startTime: '61:00',
    endTime: '62:15',
    content: 'شكراً لضيفنا على هذا الحوار الثري. الرسالة الأهم: لا تخف من الذكاء الاصطناعي، بل تعلّم كيف تستخدمه. استثمر في تطوير مهاراتك وابقَ مطلعاً على التطورات. شكراً لمتابعتكم فنجان، نلقاكم في حلقة قادمة.',
    summary: 'ملخص الحلقة مع توصيات عملية للمستمعين حول التعامل مع عصر الذكاء الاصطناعي',
    topics: ['خاتمة', 'توصيات', 'تطوير ذات'],
    mood: 'ودّي',
    order: 10,
  },
];

const demoScenes3: Scene[] = [
  {
    id: 's3-1',
    podcastId: '3',
    title: 'مقدمة: التسويق في العصر الرقمي',
    startTime: '00:00',
    endTime: '04:30',
    content: 'مرحباً بكم في سوالف بزنس. اليوم نغوص في عالم التسويق الرقمي مع خبيرة متخصصة عملت مع أكبر العلامات التجارية في المنطقة. سنتعلم كيف نبني استراتيجية تسويق رقمي فعّالة بميزانية محدودة.',
    summary: 'تقديم الحلقة والضيفة المتخصصة في التسويق الرقمي',
    topics: ['مقدمة', 'تسويق رقمي'],
    mood: 'ودّي',
    order: 1,
  },
  {
    id: 's3-2',
    podcastId: '3',
    title: 'التسويق بالمحتوى: الأساس',
    startTime: '04:30',
    endTime: '14:00',
    content: 'التسويق بالمحتوى هو حجر الأساس لأي استراتيجية رقمية ناجحة. الناس لا تريد إعلانات، تريد قيمة حقيقية. ابدأ بمدونة تحل مشاكل عملائك، أنشئ فيديوهات قصيرة تعليمية، شارك قصص عملائك الناجحين. المحتوى العربي الجيد لا يزال نادراً، وهذه فرصة ذهبية.',
    summary: 'شرح أساسيات التسويق بالمحتوى وكيفية إنشاء محتوى قيّم يجذب العملاء',
    topics: ['تسويق بالمحتوى', 'مدونة', 'فيديو', 'قصص نجاح'],
    mood: 'تعليمي',
    order: 2,
  },
  {
    id: 's3-3',
    podcastId: '3',
    title: 'وسائل التواصل الاجتماعي',
    startTime: '14:00',
    endTime: '22:00',
    content: 'في السعودية، سناب شات وتيك توك هما الأقوى للوصول للجمهور الشاب. إنستغرام ممتاز للعلامات التجارية البصرية. الإعلانات المدفوعة على هذه المنصات أصبحت متطورة جداً في الاستهداف. يمكنك استهداف جمهور في حي معين بالرياض بناءً على اهتماماته وسلوكه الشرائي.',
    summary: 'تحليل أفضل منصات التواصل الاجتماعي للتسويق في السوق السعودي',
    topics: ['سناب شات', 'تيك توك', 'إنستغرام', 'إعلانات مدفوعة'],
    mood: 'عملي',
    order: 3,
  },
  {
    id: 's3-4',
    podcastId: '3',
    title: 'التسويق عبر المؤثرين',
    startTime: '22:00',
    endTime: '29:00',
    content: 'التسويق عبر المؤثرين سلاح ذو حدين. المؤثرين الكبار مكلفون وأحياناً غير فعالين. النصيحة: ركز على الميكرو مؤثرين، أشخاص لديهم 10 إلى 50 ألف متابع في مجال تخصصك. تفاعلهم أعلى ومصداقيتهم أكبر. تأكد من أن جمهورهم حقيقي وليس مشترى.',
    summary: 'استراتيجيات فعّالة للتعاون مع المؤثرين وأهمية الميكرو مؤثرين',
    topics: ['مؤثرين', 'ميكرو مؤثرين', 'مصداقية', 'تعاون'],
    mood: 'تحليلي',
    order: 4,
  },
  {
    id: 's3-5',
    podcastId: '3',
    title: 'قياس العائد على الاستثمار',
    startTime: '29:00',
    endTime: '34:30',
    content: 'كل ريال تنفقه على التسويق يجب أن يكون قابلاً للقياس. Google Analytics أداة أساسية لأي مسوّق. تتبع مسار العميل من أول نقطة تواصل حتى الشراء. حدد مؤشرات الأداء الرئيسية: تكلفة اكتساب العميل، معدل التحويل، قيمة العميل على المدى الطويل. القرارات يجب أن تكون مبنية على بيانات، لا على حدس.',
    summary: 'أدوات وطرق قياس فعالية الحملات التسويقية والعائد على الاستثمار',
    topics: ['ROI', 'تحليلات', 'Google Analytics', 'مؤشرات أداء'],
    mood: 'جدّي',
    order: 5,
  },
  {
    id: 's3-6',
    podcastId: '3',
    title: 'استراتيجية الميزانية المحدودة',
    startTime: '34:30',
    endTime: '37:00',
    content: 'بميزانية 5000 ريال شهرياً، هذه أولوياتي: 40% للمحتوى وSEO لأنه استثمار طويل المدى، 30% للإعلانات المدفوعة المستهدفة، 20% للتسويق عبر المؤثرين الصغار، و10% للأدوات والتحليلات. النمو العضوي هو الأقوى لكنه يحتاج صبراً. الشركة الناشئة الذكية تمزج بين العضوي والمدفوع.',
    summary: 'نموذج عملي لتوزيع ميزانية التسويق الرقمي للشركات الناشئة',
    topics: ['ميزانية', 'SEO', 'نمو عضوي', 'أولويات'],
    mood: 'عملي',
    order: 6,
  },
  {
    id: 's3-7',
    podcastId: '3',
    title: 'الخلاصة والنصائح العملية',
    startTime: '37:00',
    endTime: '38:45',
    content: 'باختصار: ابدأ بالمحتوى القيّم، اختر المنصات المناسبة لجمهورك، تعاون مع مؤثرين صغار حقيقيين، وقِس كل شيء. التسويق الرقمي ليس سحراً، هو علم وفن يحتاج تجربة وتعلم مستمر. شكراً لمتابعتكم سوالف بزنس.',
    summary: 'ملخص الحلقة مع خطوات عملية قابلة للتطبيق فوراً',
    topics: ['خلاصة', 'نصائح عملية', 'خطوات'],
    mood: 'تحفيزي',
    order: 7,
  },
];

class Store {
  private podcasts: Podcast[] = [...demoPodcasts];
  private scenes: Map<string, Scene[]> = new Map();
  private metrics: SceneMetrics = { ...defaultMetrics };
  private chatHistory: ChatMessage[] = [];
  private podcastData: Map<string, PodcastData> = new Map();
  private podcastMetrics: Map<string, SceneMetrics> = new Map();
  private sceneMetadata: Map<string, SceneMetadata> = new Map();
  private embeddings: Map<string, EmbeddingVector> = new Map();
  private pipelineStatus: Map<string, PipelineStatus> = new Map();

  constructor() {
    this.scenes.set('1', [...demoScenes]);
    this.scenes.set('2', [...demoScenes2]);
    this.scenes.set('3', [...demoScenes3]);
    this.initDemoMetadata();
    this.initDemoEmbeddings();
    this.initDemoPodcastData();
    this.initDemoPipelineStatus();
  }

  private initDemoMetadata(): void {
    // Podcast 1 metadata
    const meta1: Record<string, SceneMetadata> = {
      's1': { keywords: ['سوالف بزنس', 'ترحيب', 'شركات ناشئة'], entities: [{ name: 'سوالف بزنس', type: 'منظمة' }], sentiment: 'positive', topicCategory: 'مقدمة', confidence: 0.95 },
      's2': { keywords: ['ريادة أعمال', 'جامعة', 'تقنية', 'مشروع أول', 'ميزانية'], entities: [{ name: 'السعودية', type: 'مكان' }], sentiment: 'positive', topicCategory: 'قصص نجاح', confidence: 0.92 },
      's3': { keywords: ['مستثمرين', 'تحديات', 'نظام بيئي', 'سوق', 'إثبات'], entities: [{ name: 'السعودية', type: 'مكان' }], sentiment: 'mixed', topicCategory: 'تحديات ريادية', confidence: 0.88 },
      's4': { keywords: ['رؤية 2030', 'منشآت', 'صندوق الصناديق', 'دعم حكومي', 'استثمارات أجنبية'], entities: [{ name: 'رؤية 2030', type: 'مفهوم' }, { name: 'منشآت', type: 'منظمة' }, { name: 'صندوق الصناديق', type: 'منظمة' }], sentiment: 'positive', topicCategory: 'سياسات حكومية', confidence: 0.96 },
      's5': { keywords: ['نصائح', 'شباب', 'أخطاء', 'فرص', 'تكيف'], entities: [{ name: 'السوق السعودي', type: 'مكان' }], sentiment: 'positive', topicCategory: 'إرشاد مهني', confidence: 0.90 },
      's6': { keywords: ['توسع', 'خليج', 'ذكاء اصطناعي', 'منتجات جديدة', 'تجربة مستخدم'], entities: [{ name: 'منطقة الخليج', type: 'مكان' }], sentiment: 'positive', topicCategory: 'استراتيجية أعمال', confidence: 0.87 },
      's7': { keywords: ['شريك مؤسس', 'مهارات', 'فريق عمل'], entities: [], sentiment: 'neutral', topicCategory: 'أسئلة وأجوبة', confidence: 0.85 },
      's8': { keywords: ['خاتمة', 'اشتراك', 'شكر'], entities: [{ name: 'سوالف بزنس', type: 'منظمة' }], sentiment: 'positive', topicCategory: 'خاتمة', confidence: 0.97 },
    };
    for (const [id, meta] of Object.entries(meta1)) {
      this.sceneMetadata.set(id, meta);
    }

    // Podcast 2 metadata
    const meta2: Record<string, SceneMetadata> = {
      's2-1': { keywords: ['فنجان', 'ذكاء اصطناعي', 'تقنية', 'مقدمة'], entities: [{ name: 'فنجان', type: 'منظمة' }, { name: 'عبدالرحمن أبومالح', type: 'شخص' }], sentiment: 'positive', topicCategory: 'مقدمة', confidence: 0.94 },
      's2-2': { keywords: ['ChatGPT', 'نماذج لغوية', 'تعلم آلي', 'ثورة تقنية'], entities: [{ name: 'ChatGPT', type: 'منظمة' }, { name: 'OpenAI', type: 'منظمة' }], sentiment: 'positive', topicCategory: 'تقنية', confidence: 0.93 },
      's2-3': { keywords: ['وظائف', 'أتمتة', 'بطالة', 'مهارات جديدة', 'سوق عمل'], entities: [{ name: 'السعودية', type: 'مكان' }], sentiment: 'mixed', topicCategory: 'سوق العمل', confidence: 0.89 },
      's2-4': { keywords: ['تعليم', 'جامعات', 'مناهج', 'برمجة', 'تفكير نقدي'], entities: [{ name: 'جامعة الملك سعود', type: 'منظمة' }], sentiment: 'neutral', topicCategory: 'تعليم', confidence: 0.86 },
      's2-5': { keywords: ['صحة', 'تشخيص', 'أدوية', 'طب عن بعد'], entities: [], sentiment: 'positive', topicCategory: 'صحة وتقنية', confidence: 0.91 },
      's2-6': { keywords: ['أخلاقيات', 'خصوصية', 'بيانات', 'تحيز', 'تنظيم'], entities: [], sentiment: 'negative', topicCategory: 'أخلاقيات', confidence: 0.88 },
      's2-7': { keywords: ['روبوتات', 'مصانع', 'خدمات', 'ابتكار'], entities: [{ name: 'نيوم', type: 'مكان' }], sentiment: 'positive', topicCategory: 'روبوتات', confidence: 0.85 },
      's2-8': { keywords: ['شركات ناشئة', 'تمويل', 'وادي السيليكون', 'رياض'], entities: [{ name: 'الرياض', type: 'مكان' }, { name: 'وادي السيليكون', type: 'مكان' }], sentiment: 'positive', topicCategory: 'استثمار تقني', confidence: 0.90 },
      's2-9': { keywords: ['مستقبل', 'توقعات', '2030', 'تحول رقمي'], entities: [{ name: 'رؤية 2030', type: 'مفهوم' }], sentiment: 'positive', topicCategory: 'مستقبليات', confidence: 0.87 },
      's2-10': { keywords: ['خاتمة', 'ملخص', 'توصيات'], entities: [{ name: 'فنجان', type: 'منظمة' }], sentiment: 'positive', topicCategory: 'خاتمة', confidence: 0.96 },
    };
    for (const [id, meta] of Object.entries(meta2)) {
      this.sceneMetadata.set(id, meta);
    }

    // Podcast 3 metadata
    const meta3: Record<string, SceneMetadata> = {
      's3-1': { keywords: ['تسويق رقمي', 'شركات ناشئة', 'مقدمة'], entities: [{ name: 'سوالف بزنس', type: 'منظمة' }], sentiment: 'positive', topicCategory: 'مقدمة', confidence: 0.93 },
      's3-2': { keywords: ['محتوى', 'مدونة', 'فيديو', 'SEO', 'قصص'], entities: [], sentiment: 'positive', topicCategory: 'تسويق بالمحتوى', confidence: 0.91 },
      's3-3': { keywords: ['سناب شات', 'إنستغرام', 'تيك توك', 'إعلانات مدفوعة', 'استهداف'], entities: [{ name: 'سناب شات', type: 'منظمة' }, { name: 'إنستغرام', type: 'منظمة' }, { name: 'تيك توك', type: 'منظمة' }], sentiment: 'positive', topicCategory: 'وسائل التواصل', confidence: 0.94 },
      's3-4': { keywords: ['مؤثرين', 'ميكرو مؤثرين', 'مصداقية', 'عائد', 'تعاقدات'], entities: [], sentiment: 'mixed', topicCategory: 'تسويق المؤثرين', confidence: 0.88 },
      's3-5': { keywords: ['ROI', 'تحليلات', 'Google Analytics', 'تحويل', 'مؤشرات أداء'], entities: [{ name: 'Google Analytics', type: 'منظمة' }], sentiment: 'neutral', topicCategory: 'تحليل بيانات', confidence: 0.90 },
      's3-6': { keywords: ['ميزانية', 'شركة ناشئة', 'أولويات', 'نمو عضوي'], entities: [], sentiment: 'positive', topicCategory: 'استراتيجية مالية', confidence: 0.86 },
      's3-7': { keywords: ['خلاصة', 'نصائح', 'خطوات عملية'], entities: [{ name: 'سوالف بزنس', type: 'منظمة' }], sentiment: 'positive', topicCategory: 'خاتمة', confidence: 0.95 },
    };
    for (const [id, meta] of Object.entries(meta3)) {
      this.sceneMetadata.set(id, meta);
    }
  }

  private initDemoEmbeddings(): void {
    // Generate deterministic pseudo-embeddings for all demo scenes
    const allSceneIds = [
      ...demoScenes.map(s => ({ id: s.id, podcastId: '1', text: `${s.title} ${s.summary} ${s.topics.join(' ')} ${s.content.slice(0, 200)}` })),
      ...demoScenes2.map(s => ({ id: s.id, podcastId: '2', text: `${s.title} ${s.summary} ${s.topics.join(' ')} ${s.content.slice(0, 200)}` })),
      ...demoScenes3.map(s => ({ id: s.id, podcastId: '3', text: `${s.title} ${s.summary} ${s.topics.join(' ')} ${s.content.slice(0, 200)}` })),
    ];

    for (const scene of allSceneIds) {
      const hash = scene.text.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
      const vector = Array.from({ length: 256 }, (_, i) => Math.sin(hash + i) * 0.5);
      this.embeddings.set(scene.id, {
        sceneId: scene.id,
        podcastId: scene.podcastId,
        vector,
        text: scene.text,
      });
    }
  }

  private initDemoPodcastData(): void {
    this.podcastData.set('1', {
      rawTranscript: demoScenes.map(s => s.content).join('\n\n'),
      mainThemes: ['ريادة الأعمال', 'رؤية 2030', 'الشركات الناشئة', 'التحديات والفرص'],
      keyTakeaways: [
        'النظام البيئي لريادة الأعمال في السعودية تطور بشكل كبير مع رؤية 2030',
        'البدء صغيراً والتعلم من الأخطاء هو أفضل نهج لرواد الأعمال الشباب',
        'منشآت وصندوق الصناديق وفرا دعماً حكومياً حقيقياً للمشاريع الناشئة',
        'التوسع نحو الخليج والاستثمار في الذكاء الاصطناعي هو المستقبل',
      ],
      enrichedDescription: 'حلقة شاملة تستعرض رحلة ريادة الأعمال في المملكة العربية السعودية من البدايات المتواضعة إلى رؤية 2030، مع نصائح عملية للشباب وتحليل عميق لتحديات السوق والفرص المتاحة',
    });

    this.podcastData.set('2', {
      rawTranscript: demoScenes2.map(s => s.content).join('\n\n'),
      mainThemes: ['الذكاء الاصطناعي', 'التحول الرقمي', 'سوق العمل', 'الأخلاقيات التقنية', 'الابتكار'],
      keyTakeaways: [
        'الذكاء الاصطناعي سيغير 40% من الوظائف الحالية خلال 10 سنوات',
        'التعليم يحتاج إعادة هيكلة جذرية لمواكبة التحول التقني',
        'القطاع الصحي من أكثر المستفيدين من تطبيقات الذكاء الاصطناعي',
        'الأخلاقيات والخصوصية تحديات جوهرية تحتاج تنظيماً واضحاً',
      ],
      enrichedDescription: 'حوار معمّق يستكشف تأثير الذكاء الاصطناعي والتحول الرقمي على سوق العمل السعودي والمجتمع، مع استعراض لأحدث التطورات في مجال الروبوتات والأتمتة وأخلاقيات الذكاء الاصطناعي',
    });

    this.podcastData.set('3', {
      rawTranscript: demoScenes3.map(s => s.content).join('\n\n'),
      mainThemes: ['التسويق الرقمي', 'وسائل التواصل الاجتماعي', 'التسويق بالمحتوى', 'المؤثرين', 'تحليل البيانات'],
      keyTakeaways: [
        'التسويق بالمحتوى القيّم هو الأساس لبناء ثقة العملاء',
        'سناب شات وتيك توك هما الأقوى للوصول للجمهور السعودي',
        'الميكرو مؤثرين أكثر فعالية وأقل تكلفة من المشاهير',
        'قياس العائد على الاستثمار ضروري لكل حملة تسويقية',
      ],
      enrichedDescription: 'دليل شامل لاستراتيجيات التسويق الرقمي الحديثة للشركات الناشئة في المنطقة العربية، يشمل التسويق بالمحتوى والتسويق عبر المؤثرين وقياس العائد على الاستثمار',
    });
  }

  private initDemoPipelineStatus(): void {
    this.pipelineStatus.set('1', { stage: 'complete', progress: 100, message: 'اكتمل التحليل بنجاح!' });
    this.pipelineStatus.set('2', { stage: 'complete', progress: 100, message: 'اكتمل التحليل بنجاح!' });
    this.pipelineStatus.set('3', { stage: 'complete', progress: 100, message: 'اكتمل التحليل بنجاح!' });
  }

  getPodcasts(): Podcast[] {
    return this.podcasts;
  }

  getPodcast(id: string): Podcast | undefined {
    return this.podcasts.find(p => p.id === id);
  }

  addPodcast(podcast: Podcast): void {
    this.podcasts.unshift(podcast);
  }

  updatePodcast(id: string, updates: Partial<Podcast>): void {
    const index = this.podcasts.findIndex(p => p.id === id);
    if (index !== -1) {
      this.podcasts[index] = { ...this.podcasts[index], ...updates };
    }
  }

  getScenes(podcastId: string): Scene[] {
    return this.scenes.get(podcastId) || [];
  }

  setScenes(podcastId: string, scenes: Scene[]): void {
    this.scenes.set(podcastId, scenes);
  }

  updateScene(podcastId: string, sceneId: string, updates: Partial<Scene>): void {
    const scenes = this.scenes.get(podcastId);
    if (scenes) {
      const index = scenes.findIndex(s => s.id === sceneId);
      if (index !== -1) {
        scenes[index] = { ...scenes[index], ...updates };
      }
    }
  }

  getMetrics(): SceneMetrics {
    return { ...this.metrics };
  }

  updateMetrics(updates: Partial<SceneMetrics>): void {
    this.metrics = { ...this.metrics, ...updates };
  }

  getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  addChatMessage(message: ChatMessage): void {
    this.chatHistory.push(message);
  }

  clearChatHistory(): void {
    this.chatHistory = [];
  }

  searchContent(query: string): SearchResult[] {
    const results: SearchResult[] = [];
    this.scenes.forEach((scenes, podcastId) => {
      const podcast = this.getPodcast(podcastId);
      if (!podcast) return;
      scenes.forEach(scene => {
        const contentLower = scene.content.toLowerCase();
        const queryLower = query.toLowerCase();
        const meta = this.sceneMetadata.get(scene.id);

        const contentMatch = contentLower.includes(queryLower);
        const titleMatch = scene.title.includes(query);
        const topicMatch = scene.topics.some(t => t.includes(query));
        const keywordMatch = meta?.keywords.some(k => k.includes(query)) || false;
        const entityMatch = meta?.entities.some(e => e.name.includes(query)) || false;
        const categoryMatch = meta?.topicCategory.includes(query) || false;

        if (contentMatch || titleMatch || topicMatch || keywordMatch || entityMatch || categoryMatch) {
          const highlightStart = Math.max(0, contentLower.indexOf(queryLower) - 30);
          const highlightEnd = Math.min(
            scene.content.length,
            contentLower.indexOf(queryLower) + query.length + 30
          );
          const score = contentMatch ? 0.9 : (titleMatch || keywordMatch) ? 0.8 : 0.7;
          results.push({
            podcastId,
            podcastTitle: podcast.title,
            sceneId: scene.id,
            sceneTitle: scene.title,
            content: scene.content,
            relevanceScore: score,
            timestamp: scene.startTime,
            highlights: contentMatch
              ? [scene.content.slice(highlightStart, highlightEnd)]
              : [scene.content.slice(0, 80)],
          });
        }
      });
    });
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Podcast data (raw transcripts, enriched metadata)
  getPodcastData(podcastId: string): PodcastData | undefined {
    return this.podcastData.get(podcastId);
  }

  setPodcastData(podcastId: string, data: PodcastData): void {
    this.podcastData.set(podcastId, { ...this.podcastData.get(podcastId), ...data });
  }

  // Per-podcast metrics
  getPodcastMetrics(podcastId: string): SceneMetrics | undefined {
    return this.podcastMetrics.get(podcastId);
  }

  setPodcastMetrics(podcastId: string, metrics: SceneMetrics): void {
    this.podcastMetrics.set(podcastId, metrics);
  }

  getEffectiveMetrics(podcastId?: string): SceneMetrics {
    if (podcastId) {
      const pm = this.podcastMetrics.get(podcastId);
      if (pm) return { ...pm };
    }
    return { ...this.metrics };
  }

  // Scene metadata
  getSceneMetadata(sceneId: string): SceneMetadata | undefined {
    return this.sceneMetadata.get(sceneId);
  }

  setSceneMetadata(sceneId: string, metadata: SceneMetadata): void {
    this.sceneMetadata.set(sceneId, metadata);
  }

  getAllSceneMetadata(podcastId: string): Map<string, SceneMetadata> {
    const result = new Map<string, SceneMetadata>();
    const scenes = this.scenes.get(podcastId) || [];
    for (const scene of scenes) {
      const meta = this.sceneMetadata.get(scene.id);
      if (meta) result.set(scene.id, meta);
    }
    return result;
  }

  // Embeddings
  getEmbedding(sceneId: string): EmbeddingVector | undefined {
    return this.embeddings.get(sceneId);
  }

  setEmbedding(sceneId: string, embedding: EmbeddingVector): void {
    this.embeddings.set(sceneId, embedding);
  }

  getAllEmbeddings(): EmbeddingVector[] {
    return Array.from(this.embeddings.values());
  }

  // Pipeline status
  getPipelineStatus(podcastId: string): PipelineStatus | undefined {
    return this.pipelineStatus.get(podcastId);
  }

  setPipelineStatus(podcastId: string, status: PipelineStatus): void {
    this.pipelineStatus.set(podcastId, status);
  }

  hasEmbeddings(): boolean {
    return this.embeddings.size > 0;
  }
}

export const store = new Store();
export { defaultMetrics };
