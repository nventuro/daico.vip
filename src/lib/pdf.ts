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

/** A page being drawn, which can be called off once the page is not wanted. */
export interface PdfDrawing {
  promise: Promise<void>;
  cancel(): void;
}

/**
 * `page` drawn onto `canvas`, `width` pixels wide and as tall as the page is.
 * The canvas is the picture and is never read back: a browser set to guard
 * against fingerprinting blanks or refuses what is read out of a canvas, and
 * a page that is only ever drawn into one is shown all the same.
 */
export function drawPdfPage(page: PdfPage, canvas: HTMLCanvasElement, width: number): PdfDrawing {
  const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const canvasContext = canvas.getContext('2d');
  if (!canvasContext) {
    return { promise: Promise.reject(new Error('No canvas context')), cancel() {} };
  }
  const task = page.render({ canvas, canvasContext, viewport });
  return { promise: task.promise, cancel: () => task.cancel() };
}
