// =============================================================================
// The words of a PDF with where they sit on the page, through pdf.js — the
// one thing the parsers need from a file. Loaded only when a statement is
// imported: the library and its worker are the size of the rest of the app.
// =============================================================================
import { closePdf, openPdf } from '../../lib/pdf';
import type { PageLine, PositionedWord } from './statement';

/** Words this close in height (page units) are on the same line. */
const LINE_TOLERANCE = 3;

/** Every page of `file` as its lines, top to bottom, each its words left to
 *  right. Throws when the file is not a PDF that can be opened. */
export async function readPdfPages(file: File): Promise<PageLine[][]> {
  const pdf = await openPdf(new Uint8Array(await file.arrayBuffer()));
  try {
    const pages: PageLine[][] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const { items } = await page.getTextContent();
      const rows: { y: number; words: PositionedWord[] }[] = [];
      for (const item of items) {
        if (!('str' in item) || !item.str.trim()) continue;
        const x0 = item.transform[4];
        const y = item.transform[5];
        let row = rows.find((r) => Math.abs(r.y - y) <= LINE_TOLERANCE);
        if (!row) {
          row = { y, words: [] };
          rows.push(row);
        }
        row.words.push({ text: item.str.trim(), x0, x1: x0 + item.width });
      }
      // PDF space grows upwards: the highest y is the top line.
      rows.sort((a, b) => b.y - a.y);
      pages.push(rows.map((r) => r.words.sort((a, b) => a.x0 - b.x0)));
    }
    return pages;
  } finally {
    await closePdf(pdf);
  }
}
