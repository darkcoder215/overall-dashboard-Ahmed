import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import { Buffer } from "node:buffer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

function extractSections(text: string): { title: string; content: string }[] {
  const lines = text.split("\n");
  const sections: { title: string; content: string }[] = [];
  let currentSection = { title: "مقدمة", content: "" };

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.length > 0 &&
      trimmed.length < 100 &&
      (trimmed.endsWith(":") || trimmed.match(/^(الفصل|القسم|المادة|البند|الباب|أولاً|ثانياً|ثالثاً)/))
    ) {
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection });
      }
      currentSection = { title: trimmed, content: "" };
    } else {
      currentSection.content += line + "\n";
    }
  }
  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }
  return sections;
}

// Extract text from PDF using pdf-parse
async function extractPdfText(fileBuffer: ArrayBuffer): Promise<string> {
  const pdfParse = (await import("npm:pdf-parse@1.1.1/lib/pdf-parse.js")).default;
  const buffer = Buffer.from(new Uint8Array(fileBuffer));
  const data = await pdfParse(buffer);
  return data.text || "";
}

// Parse Excel file and return headers + rows
function parseExcel(fileBuffer: ArrayBuffer): { headers: string[]; rows: Record<string, string>[]; sheetName: string } {
  const workbook = XLSX.read(new Uint8Array(fileBuffer), { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
  const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
  return { headers, rows: jsonData, sheetName };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const contentType = req.headers.get("content-type") || "";

    // JSON request = action on previewed data (step 2: confirm processing)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { action } = body;

      if (action === "process_excel") {
        // Store Excel data as structured dataset + optionally embed
        const { document_id, description, headers, rows, access_tier, title } = body;

        // Create structured dataset
        const { data: dataset, error: dsError } = await supabase
          .from("structured_datasets")
          .insert({
            document_id,
            description,
            columns: headers,
          })
          .select()
          .single();

        if (dsError) throw new Error(`Dataset insert failed: ${dsError.message}`);

        // Insert all rows with search_text (concatenation of all values for fuzzy matching)
        const rowsToInsert = rows.map((row: Record<string, string>) => ({
          dataset_id: dataset.id,
          row_data: row,
          search_text: Object.entries(row)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" | "),
        }));

        // Batch insert in groups of 100
        for (let i = 0; i < rowsToInsert.length; i += 100) {
          const batch = rowsToInsert.slice(i, i + 100);
          const { error: rowError } = await supabase.from("structured_rows").insert(batch);
          if (rowError) throw new Error(`Row insert failed: ${rowError.message}`);
        }

        // Also create vector embeddings for each row for hybrid search
        const allChunks: { content: string; chunk_index: number }[] = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const textRepr = `[${description}] ` + Object.entries(row)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" | ");
          allChunks.push({ content: textRepr, chunk_index: i });
        }

        // Batch embed
        const batchSize = 20;
        for (let i = 0; i < allChunks.length; i += batchSize) {
          const batch = allChunks.slice(i, i + batchSize);
          const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "text-embedding-3-small",
              input: batch.map((c) => c.content),
            }),
          });

          if (!embeddingResponse.ok) {
            const err = await embeddingResponse.text();
            throw new Error(`Embedding failed: ${err}`);
          }

          const embeddingData = await embeddingResponse.json();
          const chunksToInsert = batch.map((chunk, idx) => ({
            document_id,
            content: chunk.content,
            section_title: description,
            chunk_index: chunk.chunk_index,
            embedding: JSON.stringify(embeddingData.data[idx].embedding),
            metadata: { document_title: title, access_tier, type: "structured" },
          }));

          const { error: chunkError } = await supabase.from("document_chunks").insert(chunksToInsert);
          if (chunkError) throw new Error(`Chunk insert failed: ${chunkError.message}`);
        }

        // Update document status
        await supabase.from("documents").update({ status: "processed" }).eq("id", document_id);

        return new Response(
          JSON.stringify({
            success: true,
            document_id,
            dataset_id: dataset.id,
            rows_count: rows.length,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // FormData request = file upload (step 1: parse & preview)
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const accessTier = (formData.get("access_tier") as string) || "public";

    if (!file || !title) {
      return new Response(JSON.stringify({ error: "File and title are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileName = file.name.toLowerCase();
    const fileBuffer = await file.arrayBuffer();

    // Upload file to storage — sanitize filename to ASCII for valid storage keys
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = `${crypto.randomUUID()}_${safeFileName}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // Determine file type and process accordingly
    const isPdf = fileName.endsWith(".pdf");
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv");
    const isText = fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".text");

    if (isExcel) {
      // Parse Excel and return preview (don't embed yet)
      let excelData: { headers: string[]; rows: Record<string, string>[]; sheetName: string };
      
      if (fileName.endsWith(".csv")) {
        // For CSV, read as text and use XLSX
        const text = await file.text();
        const workbook = XLSX.read(text, { type: "string" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
        excelData = { headers, rows: jsonData, sheetName };
      } else {
        excelData = parseExcel(fileBuffer);
      }

      // Insert document record in pending state
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({
          title,
          file_name: file.name,
          file_path: filePath,
          access_tier: accessTier,
          status: "preview",
          metadata: {
            size: file.size,
            type: "excel",
            sheet_name: excelData.sheetName,
            rows_count: excelData.rows.length,
            columns_count: excelData.headers.length,
          },
        })
        .select()
        .single();

      if (docError) throw new Error(`Document insert failed: ${docError.message}`);

      return new Response(
        JSON.stringify({
          type: "excel_preview",
          document_id: doc.id,
          headers: excelData.headers,
          preview_rows: excelData.rows.slice(0, 20),
          total_rows: excelData.rows.length,
          sheet_name: excelData.sheetName,
          all_rows: excelData.rows, // send all rows so client can submit them back
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isPdf) {
      // Extract text from PDF
      let text: string;
      try {
        text = await extractPdfText(fileBuffer);
      } catch (pdfErr) {
        console.error("PDF parse error:", pdfErr);
        throw new Error("فشل في قراءة ملف PDF. تأكد أنه ملف PDF نصي وليس صورة ممسوحة ضوئياً.");
      }

      if (!text || text.trim().length < 10) {
        throw new Error("لم يتم العثور على نص في ملف PDF. قد يكون الملف عبارة عن صور ممسوحة ضوئياً.");
      }

      // Extract sections
      const sections = extractSections(text);

      // Insert document record
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({
          title,
          file_name: file.name,
          file_path: filePath,
          access_tier: accessTier,
          sections: sections.map((s) => ({ title: s.title })),
          status: "preview",
          metadata: {
            size: file.size,
            type: "pdf",
            sections_count: sections.length,
            text_length: text.length,
          },
        })
        .select()
        .single();

      if (docError) throw new Error(`Document insert failed: ${docError.message}`);

      return new Response(
        JSON.stringify({
          type: "pdf_preview",
          document_id: doc.id,
          text_preview: text.slice(0, 3000),
          full_text: text,
          sections: sections.map((s) => ({ title: s.title, preview: s.content.slice(0, 200) })),
          total_length: text.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Original text file handling — process immediately
    const text = await file.text();
    const sections = extractSections(text);

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        title,
        file_name: file.name,
        file_path: filePath,
        access_tier: accessTier,
        sections: sections.map((s) => ({ title: s.title })),
        status: "processing",
        metadata: { size: file.size, type: file.type, sections_count: sections.length },
      })
      .select()
      .single();

    if (docError) throw new Error(`Document insert failed: ${docError.message}`);

    // Chunk and embed
    const allChunks: { content: string; section_title: string; chunk_index: number }[] = [];
    for (const section of sections) {
      const textChunks = chunkText(section.content);
      for (const chunk of textChunks) {
        if (chunk.trim().length < 10) continue;
        allChunks.push({ content: chunk.trim(), section_title: section.title, chunk_index: allChunks.length });
      }
    }

    const batchSize = 20;
    for (let i = 0; i < allChunks.length; i += batchSize) {
      const batch = allChunks.slice(i, i + batchSize);
      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "text-embedding-3-small", input: batch.map((c) => c.content) }),
      });
      if (!embeddingResponse.ok) throw new Error(`Embedding failed: ${await embeddingResponse.text()}`);
      const embeddingData = await embeddingResponse.json();

      const chunksToInsert = batch.map((chunk, idx) => ({
        document_id: doc.id,
        content: chunk.content,
        section_title: chunk.section_title,
        chunk_index: chunk.chunk_index,
        embedding: JSON.stringify(embeddingData.data[idx].embedding),
        metadata: { document_title: title, access_tier: accessTier },
      }));

      const { error: chunkError } = await supabase.from("document_chunks").insert(chunksToInsert);
      if (chunkError) throw new Error(`Chunk insert failed: ${chunkError.message}`);
    }

    await supabase.from("documents").update({ status: "processed" }).eq("id", doc.id);

    return new Response(
      JSON.stringify({
        type: "text_processed",
        success: true,
        document_id: doc.id,
        chunks_count: allChunks.length,
        sections: sections.map((s) => s.title),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process document error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
