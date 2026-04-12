export interface Podcast {
  id: string;
  title: string;
  description: string;
  duration: string;
  uploadDate: string;
  status: 'processing' | 'ready' | 'error';
  thumbnailUrl?: string;
  scenesCount: number;
  source: 'upload' | 'transcript' | 'video-url';
}

export interface Scene {
  id: string;
  podcastId: string;
  title: string;
  startTime: string;
  endTime: string;
  content: string;
  summary: string;
  topics: string[];
  mood: string;
  order: number;
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

export interface SceneMetrics {
  minDuration: number;
  maxDuration: number;
  topicChangeThreshold: number;
  silenceThreshold: number;
  mergeShortSegments: boolean;
  splitLongSegments: boolean;
  preferredSceneCount?: number;
}

export interface SearchResult {
  podcastId: string;
  podcastTitle: string;
  sceneId: string;
  sceneTitle: string;
  content: string;
  relevanceScore: number;
  timestamp: string;
  highlights: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SearchResult[];
}

export interface UploadProgress {
  stage: 'uploading' | 'transcribing' | 'analyzing' | 'segmenting' | 'complete';
  progress: number;
  message: string;
}

export interface SceneMetadata {
  keywords: string[];
  entities: { name: string; type: string }[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  topicCategory: string;
  confidence: number;
}

export interface PodcastData {
  rawTranscript?: string;
  videoUrl?: string;
  mainThemes?: string[];
  keyTakeaways?: string[];
  enrichedDescription?: string;
}

export interface PipelineStatus {
  stage: 'transcribing' | 'segmenting' | 'enriching' | 'embedding' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export interface EmbeddingVector {
  sceneId: string;
  podcastId: string;
  vector: number[];
  text: string;
}
