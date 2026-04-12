const AI_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const AI_EMBEDDINGS_URL = 'https://openrouter.ai/api/v1/embeddings';
const VIDEO_MODEL = 'google/gemini-2.5-flash';
const TEXT_MODEL = 'google/gemini-2.5-flash';
const EMBEDDING_MODEL = 'openai/text-embedding-3-small';

interface AIResponse {
  content: string;
}

interface AIConfig {
  apiKey: string | undefined;
  isConfigured: boolean;
}

export function getAIConfig(): AIConfig {
  const apiKey = process.env.AI_API_KEY;
  return {
    apiKey,
    isConfigured: !!apiKey && apiKey !== 'your_api_key_here',
  };
}

async function callAI(
  messages: { role: string; content: string | object[] }[],
  systemPrompt?: string,
  model?: string
): Promise<AIResponse> {
  const { apiKey, isConfigured } = getAIConfig();

  if (!isConfigured) {
    return getMockResponse(
      typeof messages[messages.length - 1]?.content === 'string'
        ? (messages[messages.length - 1].content as string)
        : ''
    );
  }

  const body = {
    model: model || TEXT_MODEL,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
    ],
    max_tokens: 4096,
    temperature: 0.7,
  };

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://thmanyah.com',
      'X-Title': 'Thmanyah Podcast Analysis',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `AI request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return { content: data.choices[0]?.message?.content || '' };
}

async function callAIStructured(
  messages: { role: string; content: string | object[] }[],
  schema: object,
  schemaName: string,
  systemPrompt?: string,
  model?: string
): Promise<AIResponse> {
  const { apiKey, isConfigured } = getAIConfig();

  if (!isConfigured) {
    return getMockResponse(
      typeof messages[messages.length - 1]?.content === 'string'
        ? (messages[messages.length - 1].content as string)
        : 'تقسيم مشاهد'
    );
  }

  const body = {
    model: model || TEXT_MODEL,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
    ],
    max_tokens: 4096,
    temperature: 0.4,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: schemaName,
        strict: true,
        schema,
      },
    },
  };

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://thmanyah.com',
      'X-Title': 'Thmanyah Podcast Analysis',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `AI request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return { content: data.choices[0]?.message?.content || '' };
}

function getMockResponse(query: string): AIResponse {
  if (query.includes('تقسيم') || query.includes('مشاهد') || query.includes('scene')) {
    return {
      content: JSON.stringify({
        scenes: [
          { title: 'المقدمة', start: '00:00', end: '03:00', summary: 'افتتاح الحلقة والترحيب بالمستمعين', topics: ['مقدمة'], mood: 'ودّي' },
          { title: 'الموضوع الرئيسي', start: '03:00', end: '15:00', summary: 'بداية النقاش حول الموضوع الأساسي', topics: ['نقاش'], mood: 'جدّي' },
          { title: 'تعمّق في التفاصيل', start: '15:00', end: '28:00', summary: 'تحليل معمّق للموضوع', topics: ['تحليل'], mood: 'تحليلي' },
          { title: 'أسئلة وأجوبة', start: '28:00', end: '35:00', summary: 'التفاعل مع أسئلة المستمعين', topics: ['أسئلة'], mood: 'تفاعلي' },
          { title: 'الخاتمة', start: '35:00', end: '38:00', summary: 'ملخص وختام الحلقة', topics: ['خاتمة'], mood: 'ودّي' },
        ],
      }),
    };
  }

  return {
    content: `بناءً على محتوى البودكاستات المتوفرة، يمكنني مساعدتك في العثور على المعلومات المطلوبة.

الموضوع الذي تبحث عنه "${query}" يرتبط بعدة حلقات في مكتبتنا. يمكنك تصفح النتائج أعلاه للوصول إلى المقاطع ذات الصلة مباشرة.

هل تريد أن أساعدك في شيء آخر؟`,
  };
}

// ── Analyze transcript text ──
export async function analyzeTranscript(transcript: string): Promise<AIResponse> {
  const scenesSchema = {
    type: 'object' as const,
    properties: {
      scenes: {
        type: 'array' as const,
        description: 'List of scenes/segments identified in the podcast',
        items: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const, description: 'Scene title in Arabic' },
            start: { type: 'string' as const, description: 'Start time in MM:SS format' },
            end: { type: 'string' as const, description: 'End time in MM:SS format' },
            summary: { type: 'string' as const, description: 'Brief summary in Arabic' },
            topics: {
              type: 'array' as const,
              items: { type: 'string' as const },
              description: 'Key topics covered',
            },
            mood: { type: 'string' as const, description: 'Mood/tone of the segment in Arabic' },
          },
          required: ['title', 'start', 'end', 'summary', 'topics', 'mood'] as const,
          additionalProperties: false,
        },
      },
    },
    required: ['scenes'] as const,
    additionalProperties: false,
  };

  return callAIStructured(
    [
      {
        role: 'user',
        content: `قم بتحليل النص التالي من بودكاست وتقسيمه إلى مشاهد/مواضيع منفصلة. لكل مشهد حدد: العنوان، وقت البداية، وقت النهاية، ملخص قصير، المواضيع، والنبرة.\n\nالنص:\n${transcript}`,
      },
    ],
    scenesSchema,
    'podcast_scenes',
    'أنت مساعد متخصص في تحليل محتوى البودكاستات العربية. قم بتحليل النصوص وتقسيمها إلى مشاهد ومواضيع بطريقة ذكية. استخدم الأرقام الغربية (0-9) فقط.'
  );
}

// ── Analyze video file via URL or base64 ──
export async function analyzeVideo(
  videoSource: string,
  prompt?: string
): Promise<AIResponse> {
  const analysisPrompt = prompt ||
    'قم بتحليل هذا الفيديو من بودكاست. حدد المشاهد الرئيسية والمواضيع المطروحة والتغييرات في الموضوع. اذكر الأوقات التقريبية لكل مشهد. أجب بالعربية.';

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: analysisPrompt,
        },
        {
          type: 'video_url',
          video_url: {
            url: videoSource,
          },
        },
      ],
    },
  ];

  return callAI(
    messages,
    'أنت مساعد متخصص في تحليل محتوى البودكاستات العربية. قم بتحليل الفيديوهات وتحديد المشاهد والمواضيع. استخدم الأرقام الغربية (0-9) فقط.',
    VIDEO_MODEL
  );
}

// ── Analyze video and return structured scenes ──
export async function analyzeVideoStructured(
  videoSource: string
): Promise<AIResponse> {
  const scenesSchema = {
    type: 'object' as const,
    properties: {
      title: { type: 'string' as const, description: 'Suggested podcast title in Arabic' },
      description: { type: 'string' as const, description: 'Brief podcast description in Arabic' },
      duration: { type: 'string' as const, description: 'Estimated duration in MM:SS format' },
      scenes: {
        type: 'array' as const,
        description: 'List of scenes identified in the video',
        items: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const, description: 'Scene title in Arabic' },
            start: { type: 'string' as const, description: 'Start time in MM:SS format' },
            end: { type: 'string' as const, description: 'End time in MM:SS format' },
            summary: { type: 'string' as const, description: 'Brief summary in Arabic' },
            topics: {
              type: 'array' as const,
              items: { type: 'string' as const },
              description: 'Key topics covered',
            },
            mood: { type: 'string' as const, description: 'Mood/tone in Arabic' },
            transcript: { type: 'string' as const, description: 'Approximate transcript of what is said in Arabic' },
          },
          required: ['title', 'start', 'end', 'summary', 'topics', 'mood', 'transcript'] as const,
          additionalProperties: false,
        },
      },
    },
    required: ['title', 'description', 'duration', 'scenes'] as const,
    additionalProperties: false,
  };

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'قم بتحليل هذا الفيديو من بودكاست وتقسيمه إلى مشاهد. لكل مشهد حدد: العنوان، وقت البداية، وقت النهاية، ملخص، المواضيع، النبرة، والنص المنطوق التقريبي. اقترح أيضاً عنوان ووصف للبودكاست.',
        },
        {
          type: 'video_url',
          video_url: {
            url: videoSource,
          },
        },
      ],
    },
  ];

  return callAIStructured(
    messages,
    scenesSchema,
    'video_analysis',
    'أنت مساعد متخصص في تحليل فيديوهات البودكاستات العربية. حلل الفيديو وقسمه إلى مشاهد ومواضيع. استخدم الأرقام الغربية (0-9) فقط.',
    VIDEO_MODEL
  );
}

// ── Chat with context ──
export async function chatWithContext(
  message: string,
  context: string,
  history: { role: string; content: string }[]
): Promise<AIResponse> {
  return callAI(
    [
      ...history,
      {
        role: 'user',
        content: message,
      },
    ],
    `أنت مساعد ذكي متخصص في محتوى البودكاستات لمنصة ثمانية. استخدم السياق التالي للإجابة على أسئلة المستخدم بدقة. استخدم الأرقام الغربية (0-9) فقط.\n\nالسياق:\n${context}`
  );
}

// ── Generate scene suggestions ──
export async function generateSceneSuggestions(
  transcript: string,
  metrics: string
): Promise<AIResponse> {
  return callAI(
    [
      {
        role: 'user',
        content: `بناءً على النص التالي ومعايير التقسيم المحددة، اقترح تقسيماً للمشاهد:\n\nالنص: ${transcript}\n\nالمعايير: ${metrics}`,
      },
    ],
    'أنت متخصص في تقسيم محتوى البودكاستات إلى مشاهد. اتبع المعايير المحددة بدقة. استخدم الأرقام الغربية (0-9) فقط.'
  );
}

// ── Validate API key ──
export async function validateApiKey(): Promise<{
  valid: boolean;
  error?: string;
}> {
  const { apiKey, isConfigured } = getAIConfig();

  if (!isConfigured) {
    return { valid: false, error: 'مفتاح API غير مُعدّ' };
  }

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://thmanyah.com',
        'X-Title': 'Thmanyah Podcast Analysis',
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [{ role: 'user', content: 'مرحباً' }],
        max_tokens: 5,
      }),
    });

    if (response.ok) {
      return { valid: true };
    }

    const data = await response.json().catch(() => ({}));
    return {
      valid: false,
      error: data.error?.message || `خطأ ${response.status}: ${response.statusText}`,
    };
  } catch (err) {
    return {
      valid: false,
      error: 'تعذّر الاتصال بخادم الذكاء الاصطناعي',
    };
  }
}

// ── Transcribe media (file or URL) ──
export async function transcribeMedia(
  source: string | { base64: string; mimeType: string }
): Promise<AIResponse> {
  const transcriptSchema = {
    type: 'object' as const,
    properties: {
      fullTranscript: { type: 'string' as const, description: 'Full transcript text in Arabic' },
      estimatedDuration: { type: 'string' as const, description: 'Estimated duration in MM:SS format' },
      segments: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            startTime: { type: 'string' as const, description: 'Start time in MM:SS format' },
            endTime: { type: 'string' as const, description: 'End time in MM:SS format' },
            text: { type: 'string' as const, description: 'Transcript text for this segment' },
            speaker: { type: 'string' as const, description: 'Speaker label if detectable, e.g. المتحدث 1' },
          },
          required: ['startTime', 'endTime', 'text', 'speaker'] as const,
          additionalProperties: false,
        },
      },
    },
    required: ['fullTranscript', 'estimatedDuration', 'segments'] as const,
    additionalProperties: false,
  };

  // Build the video_url — either a direct URL or a base64 data URL
  let videoUrl: string;
  if (typeof source === 'string') {
    videoUrl = source;
  } else {
    videoUrl = `data:${source.mimeType};base64,${source.base64}`;
  }

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'قم بنسخ (transcribe) هذا المحتوى الصوتي/المرئي بالكامل إلى نص عربي. استخرج النص المنطوق بدقة مع تحديد أوقات البداية والنهاية لكل فقرة. حاول تحديد المتحدثين إن أمكن. استخدم الأرقام الغربية (0-9) فقط.',
        },
        {
          type: 'video_url',
          video_url: { url: videoUrl },
        },
      ],
    },
  ];

  return callAIStructured(
    messages,
    transcriptSchema,
    'media_transcription',
    'أنت متخصص في النسخ التلقائي للمحتوى الصوتي والمرئي العربي. انسخ كل كلمة بدقة عالية. استخدم الأرقام الغربية (0-9) فقط.',
    VIDEO_MODEL
  );
}

// ── Segment transcript with user-controlled metrics ──
export async function segmentWithMetrics(
  transcript: string,
  metrics: import('@/types').SceneMetrics
): Promise<AIResponse> {
  const scenesSchema = {
    type: 'object' as const,
    properties: {
      scenes: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const, description: 'Scene title in Arabic' },
            start: { type: 'string' as const, description: 'Start time in MM:SS format' },
            end: { type: 'string' as const, description: 'End time in MM:SS format' },
            summary: { type: 'string' as const, description: 'Brief summary in Arabic' },
            topics: {
              type: 'array' as const,
              items: { type: 'string' as const },
            },
            mood: { type: 'string' as const, description: 'Mood/tone in Arabic' },
          },
          required: ['title', 'start', 'end', 'summary', 'topics', 'mood'] as const,
          additionalProperties: false,
        },
      },
    },
    required: ['scenes'] as const,
    additionalProperties: false,
  };

  const sensitivityLabel =
    metrics.topicChangeThreshold > 0.7
      ? 'عالية - قسّم عند أي تغيير طفيف في الموضوع'
      : metrics.topicChangeThreshold > 0.4
        ? 'متوسطة'
        : 'منخفضة - فقط عند تغييرات كبيرة وواضحة';

  const metricsPrompt = `
معايير التقسيم المطلوبة:
- أقل مدة للمشهد: ${metrics.minDuration} ثانية
- أقصى مدة للمشهد: ${metrics.maxDuration} ثانية
- حساسية تغيير الموضوع: ${(metrics.topicChangeThreshold * 100).toFixed(0)}% (${sensitivityLabel})
- عتبة الصمت/التوقف: ${metrics.silenceThreshold} ثانية
- ${metrics.mergeShortSegments ? 'ادمج المقاطع القصيرة جداً مع المقاطع المجاورة' : 'اترك المقاطع القصيرة كما هي حتى لو كانت قصيرة'}
- ${metrics.splitLongSegments ? 'قسّم المقاطع الطويلة جداً إلى أجزاء أصغر' : 'اترك المقاطع الطويلة كما هي'}
${metrics.preferredSceneCount ? `- العدد المفضل للمشاهد: حوالي ${metrics.preferredSceneCount} مشهد` : ''}
`.trim();

  return callAIStructured(
    [
      {
        role: 'user',
        content: `قم بتقسيم النص التالي إلى مشاهد/مقاطع بناءً على المعايير المحددة.\n\n${metricsPrompt}\n\nالنص:\n${transcript}`,
      },
    ],
    scenesSchema,
    'metric_segmentation',
    'أنت متخصص في تقسيم محتوى البودكاستات العربية إلى مشاهد. اتبع معايير التقسيم المحددة بدقة شديدة. استخدم الأرقام الغربية (0-9) فقط.'
  );
}

// ── Enrich scene metadata ──
export async function enrichSceneMetadata(
  content: string,
  title: string
): Promise<AIResponse> {
  const metadataSchema = {
    type: 'object' as const,
    properties: {
      keywords: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: 'Key search terms in Arabic',
      },
      entities: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const },
            type: { type: 'string' as const, description: 'Entity type: شخص، مكان، منظمة، مفهوم، تاريخ' },
          },
          required: ['name', 'type'] as const,
          additionalProperties: false,
        },
      },
      sentiment: {
        type: 'string' as const,
        enum: ['positive', 'negative', 'neutral', 'mixed'],
      },
      topicCategory: { type: 'string' as const, description: 'Main topic category in Arabic' },
      confidence: { type: 'number' as const, description: 'Confidence score 0-1' },
    },
    required: ['keywords', 'entities', 'sentiment', 'topicCategory', 'confidence'] as const,
    additionalProperties: false,
  };

  return callAIStructured(
    [
      {
        role: 'user',
        content: `حلل المقطع التالي واستخرج البيانات الوصفية.\n\nالعنوان: ${title}\nالمحتوى: ${content}`,
      },
    ],
    metadataSchema,
    'scene_metadata',
    'أنت متخصص في تحليل واستخراج البيانات الوصفية من النصوص العربية. استخرج الكلمات المفتاحية والكيانات والمشاعر وتصنيف الموضوع. استخدم الأرقام الغربية (0-9) فقط.'
  );
}

// ── Enrich podcast-level metadata ──
export async function enrichPodcastMetadata(
  sceneSummaries: string[]
): Promise<AIResponse> {
  const podcastMetaSchema = {
    type: 'object' as const,
    properties: {
      mainThemes: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: 'Main themes of the podcast in Arabic',
      },
      keyTakeaways: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: 'Key takeaways in Arabic',
      },
      enrichedDescription: { type: 'string' as const, description: 'Rich podcast description in Arabic' },
    },
    required: ['mainThemes', 'keyTakeaways', 'enrichedDescription'] as const,
    additionalProperties: false,
  };

  return callAIStructured(
    [
      {
        role: 'user',
        content: `بناءً على ملخصات المشاهد التالية من بودكاست، استخرج المواضيع الرئيسية والنقاط المهمة واكتب وصفاً غنياً للحلقة.\n\nالملخصات:\n${sceneSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      },
    ],
    podcastMetaSchema,
    'podcast_metadata',
    'أنت متخصص في تحليل محتوى البودكاستات العربية واستخراج المواضيع والنقاط الرئيسية. استخدم الأرقام الغربية (0-9) فقط.'
  );
}

// ── Generate text embedding ──
export async function generateEmbedding(text: string): Promise<number[]> {
  const { apiKey, isConfigured } = getAIConfig();

  if (!isConfigured) {
    // Mock: return a deterministic pseudo-random vector based on text hash
    const hash = text.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
    return Array.from({ length: 256 }, (_, i) => Math.sin(hash + i) * 0.5);
  }

  const response = await fetch(AI_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://thmanyah.com',
      'X-Title': 'Thmanyah Podcast Analysis',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000), // limit input length
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Embedding request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return data.data[0]?.embedding || [];
}

export { callAI };
