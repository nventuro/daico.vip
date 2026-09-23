import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import type { EmailFile, ExtractedItem, Extraction } from './extract';
import { splitSharedPasses } from './split';

/** A PDF of `count` pages, page n `100 + n` points wide, so a page is told
 *  apart by its width wherever it ends up. */
async function pdf(count: number, name = 'pases'): Promise<EmailFile> {
  const doc = await PDFDocument.create();
  for (let page = 1; page <= count; page++) doc.addPage([100 + page, 200]);
  return { name, mime: 'application/pdf', bytes: await doc.save() };
}

/** Which pages of the original a file holds, by their widths. */
async function pagesIn(file: EmailFile): Promise<number[]> {
  const doc = await PDFDocument.load(file.bytes);
  return doc.getPages().map((page) => page.getWidth() - 100);
}

/** A leg boarded with the passes on these pages of file 1. */
function leg(title: string, ...passes: number[][]): ExtractedItem {
  return {
    kind: 'boarding_pass',
    title,
    on_date: '2026-09-12',
    at_time: null,
    ends_on: null,
    ends_at: null,
    transport: 'flight',
    origin: null,
    destination: null,
    comments: null,
    boarding_pass_files: passes.map((pages) => ({ file: 1, pages })),
    files: [],
  };
}

function extraction(...items: ExtractedItem[]): Extraction {
  return { trip_title: 'Bariloche', problem: null, items };
}

/** What each item is boarded with, by file number. */
const boardedWith = (out: { extraction: Extraction }) =>
  out.extraction.items.map((item) => item.boarding_pass_files.map((pass) => pass.file));

describe('splitSharedPasses', () => {
  it("cuts one leg's passes for two passengers into a file each, after the email's files", async () => {
    const files = [await pdf(2)];
    const out = await splitSharedPasses(extraction(leg('AR 1420', [1], [2])), files);
    expect(out.files).toHaveLength(3);
    expect(out.files[0]).toBe(files[0]);
    expect(await pagesIn(out.files[1])).toEqual([1]);
    expect(await pagesIn(out.files[2])).toEqual([2]);
    expect(out.files[1]).toMatchObject({ name: 'pases', mime: 'application/pdf' });
    expect(out.extraction.items[0].boarding_pass_files).toEqual([
      { file: 2, pages: [] },
      { file: 3, pages: [] },
    ]);
  });

  it('gives each leg of a connection its own passes, for every passenger', async () => {
    const out = await splitSharedPasses(
      extraction(leg('AR 1502', [3], [1]), leg('AR 1564', [2], [4])),
      [await pdf(4)],
    );
    expect(out.files).toHaveLength(5);
    const pages = await Promise.all(out.files.slice(1).map(pagesIn));
    const [first, second] = boardedWith(out);
    expect(first.map((file) => pages[file - 2])).toEqual([[3], [1]]);
    expect(second.map((file) => pages[file - 2])).toEqual([[2], [4]]);
  });

  it("keeps a page that is no one's pass with the pass it was given to", async () => {
    const out = await splitSharedPasses(extraction(leg('AR 1420', [2, 1], [3, 4])), [await pdf(4)]);
    expect(await pagesIn(out.files[1])).toEqual([1, 2]);
    expect(await pagesIn(out.files[2])).toEqual([3, 4]);
  });

  it('makes one file of a pass printed for two legs, and puts it on both', async () => {
    const out = await splitSharedPasses(
      extraction(leg('AR 1502', [1], [2]), leg('AR 1564', [2], [1])),
      [await pdf(2)],
    );
    expect(out.files).toHaveLength(3);
    expect(boardedWith(out)).toEqual([
      [2, 3],
      [3, 2],
    ]);
  });

  it("keeps a leg's other passes and takes the whole off every list it was on", async () => {
    const first: ExtractedItem = {
      ...leg('AR 1502', [1]),
      boarding_pass_files: [
        { file: 1, pages: [1] },
        { file: 2, pages: [] },
      ],
      files: [1],
    };
    const out = await splitSharedPasses(extraction(first, leg('AR 1564', [2])), [
      await pdf(2),
      await pdf(1, 'otro'),
    ]);
    expect(out.extraction.items[0]).toMatchObject({
      boarding_pass_files: [
        { file: 2, pages: [] },
        { file: 3, pages: [] },
      ],
      files: [],
    });
    expect(boardedWith(out)[1]).toEqual([4]);
  });

  it('leaves the file whole when its passes do not split it exactly', async () => {
    const cases: [number, ExtractedItem[]][] = [
      // A page with no pass.
      [3, [leg('AR 1420', [1], [2])]],
      // A page on two passes that are not the same pass.
      [2, [leg('AR 1420', [1, 2], [2])]],
      // A pass with no pages.
      [2, [leg('AR 1502', [1, 2]), leg('AR 1564', [])]],
      // A page the file does not have.
      [2, [leg('AR 1420', [1], [3])]],
      // One pass, the whole file: nothing to cut.
      [2, [leg('AR 1420', [1, 2])]],
    ];
    for (const [count, items] of cases) {
      const input = extraction(...items);
      const files = [await pdf(count)];
      const out = await splitSharedPasses(input, files);
      expect(out.files).toEqual(files);
      expect(out.extraction).toEqual(input);
    }
  });

  it('leaves the file whole when a leg boarded with it names none of its pages', async () => {
    const bare: ExtractedItem = { ...leg('AR 1564'), files: [1] };
    const out = await splitSharedPasses(extraction(leg('AR 1502', [1], [2]), bare), [await pdf(2)]);
    expect(out.files).toHaveLength(1);
  });

  it('leaves whole a file some item lists among its other files', async () => {
    const receipt: ExtractedItem = { ...leg('AR 1420'), kind: 'ticket', files: [1] };
    const out = await splitSharedPasses(extraction(leg('AR 1420', [1], [2]), receipt), [
      await pdf(2),
    ]);
    expect(out.files).toHaveLength(1);
  });

  it('counts only the passes of legs that are staged', async () => {
    const out = await splitSharedPasses(extraction(leg('AR 1502', [1]), leg('  ', [2])), [
      await pdf(2),
    ]);
    expect(out.files).toHaveLength(1);
  });

  it('leaves whole a picture, and a PDF it cannot read', async () => {
    const legs = extraction(leg('AR 1420', [1], [2]));
    const picture: EmailFile = { name: 'pase', mime: 'image/png', bytes: new Uint8Array(8) };
    expect((await splitSharedPasses(legs, [picture])).files).toEqual([picture]);
    const broken: EmailFile = {
      name: 'pases',
      mime: 'application/pdf',
      bytes: new TextEncoder().encode('%PDF-1.4 nothing more'),
    };
    expect((await splitSharedPasses(legs, [broken])).files).toEqual([broken]);
  });
});
