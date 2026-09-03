import { useEffect, useState } from 'react';
import type { PdfDocument } from '../lib/pdf';

/** A PDF as the page can draw it, once it can. */
export type PdfView =
  | { status: 'loading' }
  /** Not a PDF that can be opened. */
  | { status: 'failed' }
  | { status: 'ready'; pdf: PdfDocument };

const LOADING: PdfView = { status: 'loading' };

/**
 * The document in `file`, open for drawing: pdf.js is loaded on the first
 * call, and the document is closed when `file` changes or the caller goes.
 * With no file nothing is opened and the view stays loading.
 */
export function usePdf(file: File | null): PdfView {
  // Kept with the file it is for, so a file just swapped in never shows the
  // last one's document — which is closed by then.
  const [opened, setOpened] = useState<{ file: File; view: PdfView } | null>(null);

  useEffect(() => {
    if (!file) return;
    let active = true;
    let close: (() => void) | null = null;
    (async () => {
      const { openPdf, closePdf } = await import('../lib/pdf');
      const pdf = await openPdf(new Uint8Array(await file.arrayBuffer()));
      if (!active) {
        void closePdf(pdf);
        return;
      }
      close = () => void closePdf(pdf);
      setOpened({ file, view: { status: 'ready', pdf } });
    })().catch(() => {
      if (active) setOpened({ file, view: { status: 'failed' } });
    });
    return () => {
      active = false;
      close?.();
    };
  }, [file]);

  return opened && opened.file === file ? opened.view : LOADING;
}
