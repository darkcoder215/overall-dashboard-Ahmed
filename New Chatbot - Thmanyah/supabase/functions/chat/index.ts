import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BLOCKED_PATTERNS = [
  /كراهية|عنصري|إرهاب|تطرف|عنف/i,
  /hate|racist|terrorism|extremism|violence/i,
  /kill|murder|bomb|attack|destroy/i,
  /قتل|تفجير|هجوم|تدمير/i,
];

function isBlockedContent(text: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}

const SYSTEM_PROMPT = `أنت "مساعد ثمانية الذكي"، مساعد ذكي متخصص في الإجابة على الأسئلة بناءً على المستندات والسياسات المتاحة.

## قواعد الإجابة:
1. أجب فقط بناءً على المعلومات الموجودة في السياق المقدم لك.
2. **نسّق إجابتك بشكل منظم** باستخدام عناوين فرعية ونقاط مرقمة وقوائم عند الحاجة.
3. **لا تذكر المصادر داخل نص الإجابة.** لا تستخدم أي استشهادات مضمّنة مثل [المصدر: ...] أثناء الشرح.
4. في نهاية إجابتك فقط، أضف قسم **"المراجع المستخدمة"** يسرد كل مصدر مرة واحدة فقط (اسم المستند والقسم).
5. كن دقيقاً ومهنياً في إجاباتك.
6. أجب باللغة العربية ما لم يُطلب منك غير ذلك.
7. لا تجب على أسئلة تحتوي على محتوى كراهية أو عنصري أو عنيف.
8. لا تختلق معلومات غير موجودة في المستندات.

## عند البحث عن أشخاص أو بيانات محددة:
- إذا وجدت نتائج من البيانات الهيكلية (جداول الموظفين مثلاً)، اعرضها بشكل منظم في جدول.
- اذكر المصدر (اسم مجموعة البيانات).

## إذا لم تجد إجابة كافية:
- قل بوضوح: "لم أجد معلومات كافية في المستندات المتاحة للإجابة على هذا السؤال."
- ثم أضف قسم **"أسئلة يمكنني مساعدتك بها"** واقترح 3-5 أسئلة يمكنك الإجابة عليها بناءً على أقسام وعناوين المستندات المتاحة في السياق.
- استنتج الأسئلة المقترحة من عناوين الأقسام وموضوعات المستندات الظاهرة في السياق.`;

function extractSearchTerms(message: string): string[] {
  const stopWords = new Set([
    "ما", "من", "هل", "كيف", "أين", "متى", "لماذا", "هو", "هي", "هم", "في",
    "على", "عن", "إلى", "مع", "أو", "و", "ثم", "لكن", "لا", "نعم", "هذا",
    "هذه", "ذلك", "تلك", "الذي", "التي", "الذين", "كل", "بعض", "أي", "أن",
    "إن", "كان", "يكون", "عند", "لي", "لك", "له", "لها", "بها", "فيها",
    "عليها", "منها", "بين", "حول", "خلال", "بعد", "قبل", "فوق", "تحت",
    "يمكن", "يرجى", "أخبرني", "أعطني", "اعرض", "وش", "ايش", "شنو",
    "the", "is", "are", "what", "who", "how", "where", "when", "a", "an",
    "of", "for", "to", "in", "on", "at", "by", "with", "about", "find", "show", "tell", "me",
  ]);

  return message
    .replace(/[؟?!.,،؛:]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      message,
      conversation_id,
      user_role = "general",
      user_id,
      document_id,
    } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isBlockedContent(message)) {
      return new Response(
        JSON.stringify({
          response: "عذراً، لا يمكنني الإجابة على هذا النوع من الأسئلة. يرجى طرح سؤال آخر يتعلق بالمستندات والسياسات المتاحة.",
          citations: [],
          blocked: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Role-based access tiers
    let allowedTiers: string[];
    let access_tier: string;
    if (user_role === "hr_admin") {
      allowedTiers = ["public", "financial", "confidential"];
      access_tier = "hr_admin";
    } else if (user_role === "manager") {
      allowedTiers = ["public", "financial"];
      access_tier = "manager";
    } else {
      allowedTiers = ["public"];
      access_tier = "general";
    }

    const hasSpecificDoc = document_id && document_id !== "all";

    // ─── Embed query ───
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: message }),
    });
    if (!embeddingResponse.ok) throw new Error("Failed to embed query");
    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // ─── Vector search ───
    let chunks: any[] = [];
    try {
      const { data, error } = await supabase.rpc("match_document_chunks", {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: hasSpecificDoc ? 0.2 : 0.4,
        match_count: hasSpecificDoc ? 10 : 6,
        allowed_tiers: allowedTiers,
      });
      if (error) {
        console.error("Vector search error:", error.message);
      } else {
        chunks = data || [];
        if (hasSpecificDoc) {
          chunks = chunks.filter((c: any) => c.document_id === document_id);
        }
      }
    } catch (e) {
      console.error("Vector search exception (non-fatal):", e);
    }

    // ─── Structured data search ───
    let fuzzyResults: any[] = [];
    let targetDatasetIds: string[] | null = null;

    // Resolve dataset IDs for the selected document
    if (hasSpecificDoc) {
      const { data: datasets } = await supabase
        .from("structured_datasets")
        .select("id")
        .eq("document_id", document_id);
      targetDatasetIds = (datasets || []).map((d: any) => d.id);
      console.log(`Structured search: doc=${document_id}, datasets=${JSON.stringify(targetDatasetIds)}`);
    }

    // Strategy 1: pg_trgm fuzzy search
    try {
      const { data: fuzzyData } = await supabase.rpc("fuzzy_search_structured", {
        search_query: message,
        max_results: 15,
      });
      if (fuzzyData && fuzzyData.length > 0) {
        fuzzyResults = targetDatasetIds
          ? fuzzyData.filter((r: any) => targetDatasetIds!.includes(r.dataset_id))
          : fuzzyData;
      }
    } catch (e) {
      console.error("Fuzzy search error (non-fatal):", e);
    }

    // Strategy 2: ILIKE keyword search
    if (fuzzyResults.length === 0) {
      const searchTerms = extractSearchTerms(message);
      console.log(`ILIKE search terms: ${JSON.stringify(searchTerms)}`);
      if (searchTerms.length > 0) {
        try {
          let query = supabase
            .from("structured_rows")
            .select("id, dataset_id, row_data, search_text, structured_datasets!inner(description, columns)")
            .limit(20);

          if (targetDatasetIds && targetDatasetIds.length > 0) {
            query = query.in("dataset_id", targetDatasetIds);
          }

          const orConditions = searchTerms.map((t) => `search_text.ilike.%${t}%`).join(",");
          query = query.or(orConditions);

          const { data: ilikeData, error: ilikeError } = await query;
          if (ilikeError) {
            console.error("ILIKE search error:", ilikeError.message);
          } else if (ilikeData && ilikeData.length > 0) {
            fuzzyResults = ilikeData.map((r: any) => ({
              id: r.id,
              dataset_id: r.dataset_id,
              row_data: r.row_data,
              search_text: r.search_text,
              description: r.structured_datasets?.description || "",
              columns: r.structured_datasets?.columns || [],
              similarity: 0,
            }));
          }
        } catch (e) {
          console.error("ILIKE search exception (non-fatal):", e);
        }
      }
    }

    // Strategy 3: If specific doc selected and still nothing, provide sample rows for context
    if (fuzzyResults.length === 0 && targetDatasetIds && targetDatasetIds.length > 0) {
      console.log("Falling back to sample rows for datasets:", targetDatasetIds);
      try {
        const { data: sampleData } = await supabase
          .from("structured_rows")
          .select("id, dataset_id, row_data, search_text, structured_datasets!inner(description, columns)")
          .in("dataset_id", targetDatasetIds)
          .limit(10);

        if (sampleData && sampleData.length > 0) {
          fuzzyResults = sampleData.map((r: any) => ({
            id: r.id,
            dataset_id: r.dataset_id,
            row_data: r.row_data,
            search_text: r.search_text,
            description: r.structured_datasets?.description || "",
            columns: r.structured_datasets?.columns || [],
            similarity: 0,
          }));
        }
      } catch (e) {
        console.error("Sample rows error (non-fatal):", e);
      }
    }

    console.log(`Results: ${chunks.length} vector chunks, ${fuzzyResults.length} structured rows`);

    // ─── Build context ───
    let context = chunks
      .map(
        (c: any, i: number) =>
          `[مرجع ${i + 1}] المصدر: ${c.document_title} — القسم: ${c.section_title || "عام"}\n${c.content}`
      )
      .join("\n\n---\n\n");

    if (fuzzyResults.length > 0) {
      const structuredContext = fuzzyResults
        .map((r: any, i: number) => {
          const cols = r.columns || [];
          const rowData = r.row_data || {};
          const formatted = cols
            .map((col: string) => `${col}: ${rowData[col] ?? "—"}`)
            .join(" | ");
          return `[بيانات هيكلية ${i + 1}] المصدر: ${r.description}\n${formatted}`;
        })
        .join("\n\n");
      context += "\n\n=== بيانات هيكلية (جداول) ===\n\n" + structuredContext;
    }

    // Available doc topics for suggestions
    const { data: allDocs } = await supabase
      .from("documents")
      .select("title, sections, access_tier")
      .eq("status", "processed")
      .in("access_tier", allowedTiers);

    const availableTopics = (allDocs || [])
      .map((d: any) => {
        const sectionTitles = (d.sections || []).map((s: any) => s.title).filter(Boolean);
        return `المستند: ${d.title} | الأقسام: ${sectionTitles.join("، ") || "عام"}`;
      })
      .join("\n");

    const citations = chunks.map((c: any) => ({
      document_title: c.document_title,
      section_title: c.section_title,
      content_preview: c.content,
    }));

    // ─── Conversation history ───
    let conversationHistory: any[] = [];
    let convId = conversation_id;

    if (convId) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(10);
      conversationHistory = msgs || [];
    } else {
      const { data: conv } = await supabase
        .from("conversations")
        .insert({ access_tier, title: message.slice(0, 100) })
        .select()
        .single();
      convId = conv?.id;
    }

    if (convId) {
      await supabase.from("messages").insert({
        conversation_id: convId,
        role: "user",
        content: message,
      });
    }

    // ─── Generate response ───
    const openaiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
      {
        role: "user",
        content: context
          ? `السياق من المستندات:\n\n${context}\n\n---\n\nالمستندات المتاحة وأقسامها:\n${availableTopics}\n\n---\n\nسؤال المستخدم: ${message}`
          : `المستندات المتاحة وأقسامها:\n${availableTopics}\n\n---\n\nسؤال المستخدم: ${message}`,
      },
    ];

    const completionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!completionResponse.ok) {
      const err = await completionResponse.text();
      throw new Error(`OpenAI completion failed: ${err}`);
    }

    const completionData = await completionResponse.json();
    const assistantMessage = completionData.choices[0].message.content;

    if (convId) {
      await supabase.from("messages").insert({
        conversation_id: convId,
        role: "assistant",
        content: assistantMessage,
        citations,
      });
    }

    // Log query and answer
    try {
      let docSource = "all";
      if (hasSpecificDoc) {
        const { data: docData } = await supabase
          .from("documents")
          .select("title")
          .eq("id", document_id)
          .single();
        docSource = docData?.title || document_id;
      }
      await supabase.from("query_logs").insert({
        question: message,
        answer: assistantMessage,
        document_source: docSource,
        access_tier,
      });
    } catch (e) {
      console.error("Query log insert error (non-fatal):", e);
    }

    return new Response(
      JSON.stringify({
        response: assistantMessage,
        conversation_id: convId,
        citations,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
