import { useEffect, useRef, useState } from 'react';
import type { PdfDocument, PdfPage as Page } from '../lib/pdf';
import { useObjectUrl } from '../hooks/useObjectUrl';
import LoadingLine from './LoadingLine';

/** Widest a page is ever drawn, in device pixels: sharp on a phone held
 *  close, and no larger than that. */
const PDF_PAGE_MAX_PX = 2000;

/** How far off screen a page may be and still be drawn, as a share of the
 *  screen: the next page is ready by the time it is scrolled to. */
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
 * One page of a document, in the page's own shape, drawn only once it is
 * near the screen: a document of many pages is drawn as it is scrolled
 * through, never all at once. Until then it holds its place blank.
 */
export default function PdfPage({
  pdf,
  number,
  alt,
  className = '',
  inverse = false,
}: PdfPageProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [page, setPage] = useState<{ page: Page; ratio: number } | null>(null);
  const [near, setNear] = useState(false);
  const [picture, setPicture] = useState<Blob | null>(null);
  const url = useObjectUrl(picture);

  // The page's shape first, so its place is held before it is drawn.
  useEffect(() => {
    let active = true;
    (async () => {
      const [{ pageRatio }, got] = await Promise.all([import('../lib/pdf'), pdf.getPage(number)]);
      if (active) setPage({ page: got, ratio: pageRatio(got) });
    })().catch(() => {});
    return () => {
      active = false;
    };
  }, [pdf, number]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: PDF_PAGE_DRAW_MARGIN },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!page || !near || !element) return;
    let active = true;
    (async () => {
      const { renderPdfPage } = await import('../lib/pdf');
      const width = Math.min(
        PDF_PAGE_MAX_PX,
        Math.max(1, Math.round(element.clientWidth * devicePixelRatio)),
      );
      const blob = await renderPdfPage(page.page, width);
      if (active) setPicture(blob);
    })().catch(() => {});
    return () => {
      active = false;
    };
  }, [page, near]);

  return (
    <span
      ref={ref}
      className={`relative block overflow-hidden bg-surface-raised ${className}`}
      style={{ aspectRatio: page?.ratio }}
    >
      {url ? (
        <img src={url} alt={alt} className="block h-full w-full" />
      ) : (
        <LoadingLine inverse={inverse} className="absolute inset-x-0 bottom-0" />
      )}
    </span>
  );
}
