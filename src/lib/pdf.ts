// =============================================================================
// The one way into pdf.js: opening a document and drawing a page of it. The
// library and its worker are the size of the rest of the app, so this module
// is only ever imported on demand — when a statement is read, or when a PDF
// attachment is first drawn.
// =============================================================================
import { getDocument, PDFWorker, type PDFDocumentProxy, type PDFPageProxy } from 'pdfjs-dist';
import PdfWorkerScript from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

export type PdfDocument = PDFDocumentProxy;
export type PdfPage = PDFPageProxy;

/** Encoder quality of a page drawn as a picture; text stays sharp at it. */
const PDF_PAGE_JPEG_QUALITY = 0.9;

// One worker serves every document open at once, handed to each explicitly:
// a document given a worker of its own would take it down when closed, and a
// grid may hold several PDFs open at a time.
let worker: PDFWorker | null = null;

function sharedWorker(): PDFWorker {
  worker ??= PDFWorker.create({ port: new PdfWorkerScript() });
  return worker;
}

/**
 * The document in `data`, ready to hand out its pages; `data` is handed over
 * and must not be read again. Throws when the bytes are not a PDF that can be
 * opened. The caller closes it once done with its pages.
 */
export function openPdf(data: Uint8Array): Promise<PdfDocument> {
  return getDocument({ data, worker: sharedWorker() }).promise;
}

/** Let go of everything held for `pdf`, here and in the worker. */
export function closePdf(pdf: PdfDocument): Promise<void> {
  return pdf.loadingTask.destroy();
}

/** How wide `page` is for its height, as CSS's `aspect-ratio` has it. */
export function pageRatio(page: PdfPage): number {
  const { width, height } = page.getViewport({ scale: 1 });
  return width / height;
}

/** `page` drawn `width` pixels wide, as a picture the screen can show. */
export async function renderPdfPage(page: PdfPage, width: number): Promise<Blob> {
  const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const canvasContext = canvas.getContext('2d');
  if (!canvasContext) throw new Error('No canvas context');
  await page.render({ canvas, canvasContext, viewport }).promise;
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the page'))),
      'image/jpeg',
      PDF_PAGE_JPEG_QUALITY,
    ),
  );
}
