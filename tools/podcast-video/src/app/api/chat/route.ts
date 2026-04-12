import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { chatWithContext } from '@/lib/ai';
import { semanticSearch } from '@/lib/embeddings';
import type { SearchResult } from '@/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, history = [] } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: 'الرجاء إدخال سؤال' }, { status: 400 });
  }

  // Retrieve context — prefer semantic search, fallback to keyword
  let searchResults: SearchResult[];
  if (store.hasEmbeddings()) {
    try {
      searchResults = await semanticSearch(message, 5);
    } catch {
      searchResults = store.searchContent(message).slice(0, 5);
    }
  } else {
    searchResults = store.searchContent(message).slice(0, 5);
  }

  // Build rich context including metadata
  const contextParts = searchResults.map((r) => {
    const meta = store.getSceneMetadata(r.sceneId);
    let contextStr = `[${r.podcastTitle} - ${r.sceneTitle}]: ${r.content}`;
    if (meta) {
      if (meta.keywords.length > 0) {
        contextStr += `\nكلمات مفتاحية: ${meta.keywords.join('، ')}`;
      }
      if (meta.entities.length > 0) {
        contextStr += `\nكيانات: ${meta.entities.map(e => `${e.name} (${e.type})`).join('، ')}`;
      }
    }
    return contextStr;
  });

  const context = contextParts.join('\n\n');

  try {
    const aiResponse = await chatWithContext(message, context, history);

    return NextResponse.json({
      response: aiResponse.content,
      sources: searchResults.slice(0, 3),
    });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء المعالجة' },
      { status: 500 }
    );
  }
}
