import { useEffect, useRef, useState } from 'react';
import type { PdfDocument, PdfDrawing, PdfPage as Page } from '../lib/pdf';
import LoadingLine from './LoadingLine';

/** Widest a page is ever drawn, in device pixels: sharp on a phone held
 *  close, and no larger than that. */
const PDF_PAGE_MAX_PX = 2000;

/** How far off screen a page may be and still be kept drawn, as a share of
 *  the screen: the next page is ready by the time it is scrolled to, and one
 *  scrolled far past is let go of. */
const PDF_PAGE_DRAW_MARGIN = '100%';

interface PdfPageProps {
  pdf: PdfDocument;
  /** Which page, counted from 1. */
  number: number;
  /** For a screen reader; the page is otherwise a picture of text. */
  alt: string;
  /** How the page is placed and sized; it keeps the page's own shape. */
  className?: string;
  /** Drawn for an inverse surface. */
  inverse?: boolean;
}

/**
 * One page of a document, in the page's own shape, drawn only while it is
 * near the screen: a document of many pages is drawn as it is scrolled
 * through, never all at once, and a page scrolled far past gives its bitmap
 * back. Until drawn it holds its place blank.
 */
export default function PdfPage({
  pdf,
  number,
  alt,
  className = '',
  inverse = false,
}: PdfPageProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState<{ page: Page; ratio: number } | null>(null);
  const [near, setNear] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [failed, setFailed] = useState(false);

  // The page's shape first, so its place is held before it is drawn.
  useEffect(() => {
    let active = true;
    (async () => {
      const [{ pageRatio }, got] = await Promise.all([import('../lib/pdf'), pdf.getPage(number)]);
      if (active) setPage({ page: got, ratio: pageRatio(got) });
    })().catch((e: unknown) => {
      console.error(`PDF page ${number}:`, e);
      if (active) setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [pdf, number]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => setNear(entries[entries.length - 1].isIntersecting),
      { rootMargin: PDF_PAGE_DRAW_MARGIN },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = ref.current;
    const canvas = canvasRef.current;
    if (!page || !near || !element || !canvas) return;
    let active = true;
    let drawing: PdfDrawing | null = null;
    (async () => {
      const { drawPdfPage } = await import('../lib/pdf');
      if (!active) return;
      const width = Math.min(
        PDF_PAGE_MAX_PX,
        Math.max(1, Math.round(element.clientWidth * devicePixelRatio)),
      );
      drawing = drawPdfPage(page.page, canvas, width);
      await drawing.promise;
      if (active) setDrawn(true);
    })().catch((e: unknown) => {
      if (!active) return;
      console.error(`PDF page ${number}:`, e);
      setFailed(true);
    });
    return () => {
      active = false;
      drawing?.cancel();
      // The bitmap is the bulk of what a page costs; a page no longer near
      // gives it back and is drawn afresh when it comes round again.
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [page, near, number]);

  return (
    <span
      ref={ref}
      className={`relative block overflow-hidden bg-surface-raised ${className}`}
      style={{ aspectRatio: page?.ratio }}
    >
      <canvas ref={canvasRef} role="img" aria-label={alt} className="block h-full w-full" />
      {failed ? (
        <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-error">
          No se pudo dibujar la página.
        </span>
      ) : (
        !(near && drawn) && (
          <LoadingLine inverse={inverse} className="absolute inset-x-0 bottom-0" />
        )
      )}
    </span>
  );
}
