import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { semanticSearch } from '@/lib/embeddings';
import type { SearchResult } from '@/types';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') || '';
  if (!query.trim()) {
    return NextResponse.json({ results: [], mode: 'none' });
  }

  // Always get keyword results as baseline
  const keywordResults = store.searchContent(query);

  // If embeddings exist, also do semantic search
  if (store.hasEmbeddings()) {
    try {
      const semanticResults = await semanticSearch(query, 10);

      // Merge: deduplicate by sceneId, prefer higher score
      const merged = new Map<string, SearchResult>();

      for (const r of keywordResults) {
        merged.set(r.sceneId, r);
      }

      for (const r of semanticResults) {
        const existing = merged.get(r.sceneId);
        if (!existing || r.relevanceScore > existing.relevanceScore) {
          merged.set(r.sceneId, r);
        }
      }

      const results = Array.from(merged.values())
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 15);

      return NextResponse.json({ results, mode: 'semantic' });
    } catch {
      // Fall through to keyword-only
    }
  }

  return NextResponse.json({ results: keywordResults, mode: 'keyword' });
}
