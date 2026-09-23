// =============================================================================
// A PDF that holds several boarding passes — one per passenger, one per leg,
// or both — cut into one PDF per pass, so every pass is a file of its own on
// its pasaje's shelf. The cut is made only when the model's passes account
// for the whole file, every page with exactly one pass (a pass printed for
// two legs is one pass, named by both): a page left off every part could be
// a pass lost, so on any doubt the file stays whole, on every leg that lists
// it.
// =============================================================================
import { PDFDocument } from 'pdf-lib';
import {
  otherNumbers,
  passNumbers,
  stagedTitle,
  type EmailFile,
  type ExtractedItem,
  type Extraction,
} from './extract';

/** A pass's pages as one key, whatever order and repeats the model gave
 *  them in, so two legs naming the same pass name the same part. */
function passKey(pages: number[]): string {
  return [...new Set(pages)].sort((a, b) => a - b).join(',');
}

/** The pages of each pass an item said file `number` holds for it. An item
 *  boarded with the file that named none of its pages gives an empty pass,
 *  which no cut accepts. */
function passesIn(item: ExtractedItem, number: number): number[][] {
  const passes = item.boarding_pass_files
    .filter((pass) => pass.file === number)
    .map((pass) => pass.pages);
  return passes.length > 0 ? passes : [[]];
}

/** The passes, once each, as page lists in the file's order, when they split
 *  pages 1 to `count` between them — every page on exactly one, none
 *  without a page — and there are at least two; null otherwise. */
function cuttable(passes: number[][], count: number): number[][] | null {
  const distinct = [...new Set(passes.map(passKey))].map((key) =>
    key === '' ? [] : key.split(',').map(Number),
  );
  const pages = distinct.flat();
  const splits =
    distinct.length > 1 &&
    distinct.every((pass) => pass.length > 0) &&
    pages.length === count &&
    new Set(pages).size === count &&
    pages.every((page) => Number.isInteger(page) && page >= 1 && page <= count);
  return splits ? distinct : null;
}

/** The file cut into one PDF per pass, by pass key; null when it cannot be
 *  read, is locked, or the passes do not split it whole. */
async function cut(file: EmailFile, passes: number[][]): Promise<Map<string, EmailFile> | null> {
  try {
    const source = await PDFDocument.load(file.bytes);
    const split = cuttable(passes, source.getPageCount());
    if (split === null) return null;
    const parts = new Map<string, EmailFile>();
    for (const pages of split) {
      const part = await PDFDocument.create();
      const indices = pages.map((page) => page - 1);
      for (const page of await part.copyPages(source, indices)) part.addPage(page);
      parts.set(passKey(pages), { name: file.name, mime: file.mime, bytes: await part.save() });
    }
    return parts;
  } catch {
    return null;
  }
}

/**
 * The extraction and the email's files with every PDF that holds more than
 * one of the staged legs' passes cut into a part per pass: the parts go
 * after the email's files, numbered on from them, and each leg lists its
 * passes' parts in place of the whole. The whole stays in the list, named
 * by no item. A file some item lists among its other files is left whole,
 * as is any the cut refuses.
 */
export async function splitSharedPasses(
  extraction: Extraction,
  files: EmailFile[],
): Promise<{ extraction: Extraction; files: EmailFile[] }> {
  let items = extraction.items;
  const all = [...files];
  for (const [index, file] of files.entries()) {
    const number = index + 1;
    if (file.mime !== 'application/pdf') continue;
    if (items.some((item) => otherNumbers(item).includes(number))) continue;
    const claimants = items.flatMap((item, at) =>
      stagedTitle(item) !== null && passNumbers(item).includes(number) ? [at] : [],
    );
    const parts = await cut(
      file,
      claimants.flatMap((at) => passesIn(items[at], number)),
    );
    if (parts === null) continue;
    const numbers = new Map<string, number>();
    for (const [key, part] of parts) {
      all.push(part);
      numbers.set(key, all.length);
    }
    items = items.map((item, at) => {
      if (!claimants.includes(at)) return item;
      const own = new Set(
        passesIn(item, number).flatMap((pages) => numbers.get(passKey(pages)) ?? []),
      );
      return {
        ...item,
        boarding_pass_files: [
          ...item.boarding_pass_files.filter((pass) => pass.file !== number),
          ...[...own].map((part) => ({ file: part, pages: [] })),
        ],
        files: item.files.filter((other) => other !== number),
      };
    });
  }
  return { extraction: { ...extraction, items }, files: all };
}
