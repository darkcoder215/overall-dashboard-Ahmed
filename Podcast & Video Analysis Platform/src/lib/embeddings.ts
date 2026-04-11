import { Scene, SceneMetadata, SearchResult, EmbeddingVector } from '@/types';
import { generateEmbedding } from './ai';
import { store } from './store';

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export function buildSceneEmbeddingText(
  scene: Scene,
  metadata?: SceneMetadata
): string {
  const parts = [scene.title, scene.summary];
  if (scene.topics.length > 0) {
    parts.push(scene.topics.join(' '));
  }
  // Use first 500 chars of content to keep embedding focused
  if (scene.content) {
    parts.push(scene.content.slice(0, 500));
  }
  if (metadata) {
    if (metadata.keywords.length > 0) {
      parts.push(metadata.keywords.join(' '));
    }
    if (metadata.entities.length > 0) {
      parts.push(metadata.entities.map(e => e.name).join(' '));
    }
    if (metadata.topicCategory) {
      parts.push(metadata.topicCategory);
    }
  }
  return parts.join(' | ');
}

export async function semanticSearch(
  query: string,
  topK: number = 10
): Promise<SearchResult[]> {
  const allEmbeddings = store.getAllEmbeddings();
  if (allEmbeddings.length === 0) return [];

  const queryVector = await generateEmbedding(query);
  if (queryVector.length === 0) return [];

  const scored: { embedding: EmbeddingVector; score: number }[] = [];
  for (const emb of allEmbeddings) {
    const score = cosineSimilarity(queryVector, emb.vector);
    scored.push({ embedding: emb, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const topResults = scored.slice(0, topK);

  const results: SearchResult[] = [];
  for (const { embedding, score } of topResults) {
    if (score < 0.1) continue; // skip very low relevance

    const podcast = store.getPodcast(embedding.podcastId);
    const scenes = store.getScenes(embedding.podcastId);
    const scene = scenes.find(s => s.id === embedding.sceneId);
    if (!podcast || !scene) continue;

    results.push({
      podcastId: embedding.podcastId,
      podcastTitle: podcast.title,
      sceneId: scene.id,
      sceneTitle: scene.title,
      content: scene.content,
      relevanceScore: Math.round(score * 100) / 100,
      timestamp: scene.startTime,
      highlights: [scene.content.slice(0, 100)],
    });
  }

  return results;
}

export async function embedAllScenes(podcastId: string): Promise<void> {
  const scenes = store.getScenes(podcastId);
  if (scenes.length === 0) return;

  const BATCH_SIZE = 3;
  for (let i = 0; i < scenes.length; i += BATCH_SIZE) {
    const batch = scenes.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (scene) => {
        const metadata = store.getSceneMetadata(scene.id);
        const text = buildSceneEmbeddingText(scene, metadata);
        const vector = await generateEmbedding(text);
        store.setEmbedding(scene.id, {
          sceneId: scene.id,
          podcastId,
          vector,
          text,
        });
      })
    );
    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < scenes.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}
