"use client";

// Renders each PDF page to a base64 JPEG so it can be sent to a vision model.
// pdfjs-dist is loaded lazily so it doesn't run at SSR/build time.

type PdfJsModule = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfjs(): Promise<PdfJsModule> {
  if (pdfjsPromise) return pdfjsPromise;
  pdfjsPromise = (async () => {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    return pdfjs;
  })();
  return pdfjsPromise;
}

export interface PdfPageImage {
  pageNumber: number;
  dataUrl: string;
  base64: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
}

export interface RenderPdfOptions {
  scale?: number;
  maxPages?: number;
  jpegQuality?: number;
  onProgress?: (done: number, total: number) => void;
}

export async function renderPdfToImages(
  file: File,
  opts: RenderPdfOptions = {}
): Promise<PdfPageImage[]> {
  const { scale = 1.6, maxPages = 12, jpegQuality = 0.85, onProgress } = opts;

  const pdfjs = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;

  const pageCount = Math.min(pdf.numPages, maxPages);
  const images: PdfPageImage[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", jpegQuality);
    const base64 = dataUrl.split(",")[1] ?? "";
    images.push({
      pageNumber: i,
      dataUrl,
      base64,
      mimeType: "image/jpeg",
      width: canvas.width,
      height: canvas.height,
    });

    page.cleanup();
    onProgress?.(i, pageCount);
  }

  pdf.destroy();
  return images;
}
