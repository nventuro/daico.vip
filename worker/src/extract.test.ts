import { describe, it, expect } from 'vitest';
import { decide, rowsFromExtraction, type ExtractedItem, type Extraction } from './extract';

function item(overrides: Partial<ExtractedItem> = {}): ExtractedItem {
  return {
    kind: 'ticket',
    title: 'AR 1420',
    on_date: '2026-09-12',
    at_time: '08:40',
    ends_on: '2026-09-12',
    ends_at: '11:05',
    from_code: 'AEP',
    to_code: 'BRC',
    comments: 'Código QK7T2M',
    pdfs: [],
    ...overrides,
  };
}

/** The ids the email's PDFs would be staged under, one per PDF, in order. */
const FILE_IDS = ['file-1', 'file-2', 'file-3'];

describe('rowsFromExtraction', () => {
  it('keeps everything a ticket carries, trimmed', () => {
    const [row] = rowsFromExtraction(
      [item({ title: '  AR 1420 ' })],
      'Bariloche',
      'Fwd: Tu vuelo',
      [],
    );
    expect(row).toEqual({
      email_subject: 'Fwd: Tu vuelo',
      trip_title: 'Bariloche',
      kind: 'ticket',
      title: 'AR 1420',
      on_date: '2026-09-12',
      at_time: '08:40',
      ends_on: '2026-09-12',
      ends_at: '11:05',
      from_code: 'AEP',
      to_code: 'BRC',
      comments: 'Código QK7T2M',
      file_ids: [],
    });
  });

  it('clears the hours and the codes of a stay, whatever the model put there', () => {
    const [row] = rowsFromExtraction(
      [item({ kind: 'lodging', title: 'Hotel Cormorán' })],
      'Bariloche',
      null,
      [],
    );
    expect(row.at_time).toBeNull();
    expect(row.ends_at).toBeNull();
    expect(row.from_code).toBeNull();
    expect(row.to_code).toBeNull();
    expect(row.on_date).toBe('2026-09-12');
    expect(row.ends_on).toBe('2026-09-12');
    expect(row.email_subject).toBe('');
  });

  it('clears the end and the codes of a booking', () => {
    const [row] = rowsFromExtraction(
      [item({ kind: 'booking', title: 'Autos Pampa' })],
      'Bariloche',
      null,
      [],
    );
    expect(row.ends_on).toBeNull();
    expect(row.ends_at).toBeNull();
    expect(row.from_code).toBeNull();
    expect(row.to_code).toBeNull();
    expect(row.at_time).toBe('08:40');
  });

  it('drops an item with a blank title and keeps the rest', () => {
    const rows = rowsFromExtraction(
      [item({ title: '   ' }), item({ title: 'AR 1425' })],
      'Bariloche',
      null,
      [],
    );
    expect(rows.map((row) => row.title)).toEqual(['AR 1425']);
  });

  it('nulls a date or hour not written as asked, and blank text', () => {
    const [row] = rowsFromExtraction(
      [item({ on_date: '12/09/2026', at_time: '8.40', comments: '  ', from_code: '' })],
      'Bariloche',
      null,
      [],
    );
    expect(row.on_date).toBeNull();
    expect(row.at_time).toBeNull();
    expect(row.comments).toBeNull();
    expect(row.from_code).toBeNull();
  });

  it("turns an item's PDF numbers into the ids of those PDFs, in the email's order", () => {
    const [row] = rowsFromExtraction([item({ pdfs: [3, 1] })], 'Bariloche', null, FILE_IDS);
    expect(row.file_ids).toEqual(['file-1', 'file-3']);
  });

  it('drops a number that names no PDF and counts one named twice once', () => {
    const [row] = rowsFromExtraction(
      [item({ pdfs: [0, 2, 4, 2, -1, 1.5] })],
      'Bariloche',
      null,
      FILE_IDS,
    );
    expect(row.file_ids).toEqual(['file-2']);
  });

  it('names no file when the model named none, or the email had none', () => {
    const [none] = rowsFromExtraction([item({ pdfs: [] })], 'Bariloche', null, FILE_IDS);
    expect(none.file_ids).toEqual([]);
    const [noPdfs] = rowsFromExtraction([item({ pdfs: [1] })], 'Bariloche', null, []);
    expect(noPdfs.file_ids).toEqual([]);
  });

  it('lets one PDF belong to several rows', () => {
    const rows = rowsFromExtraction(
      [item({ pdfs: [1] }), item({ title: 'AR 1425', pdfs: [1] })],
      'Bariloche',
      null,
      FILE_IDS,
    );
    expect(rows.map((row) => row.file_ids)).toEqual([['file-1'], ['file-1']]);
  });
});

describe('decide', () => {
  const found: Extraction = { trip_title: 'Bariloche', problem: null, items: [item()] };

  it('stages what was found under the trip name', () => {
    const decision = decide(found, 'Fwd: Tu vuelo', []);
    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.tripTitle).toBe('Bariloche');
      expect(decision.rows).toHaveLength(1);
    }
  });

  it('carries the PDF ids through to the rows', () => {
    const decision = decide({ ...found, items: [item({ pdfs: [2] })] }, null, FILE_IDS);
    expect(decision.ok).toBe(true);
    if (decision.ok) expect(decision.rows[0].file_ids).toEqual(['file-2']);
  });

  it('fails with the problem the model reported', () => {
    const decision = decide({ ...found, problem: 'Es un recibo, no una confirmación.' }, null, []);
    expect(decision).toEqual({ ok: false, problem: 'Es un recibo, no una confirmación.' });
  });

  it('fails without a word when nothing was found, the trip is unnamed, or every item was blank', () => {
    expect(decide({ ...found, items: [] }, null, [])).toEqual({ ok: false, problem: null });
    expect(decide({ ...found, trip_title: null }, null, [])).toEqual({ ok: false, problem: null });
    expect(decide({ ...found, trip_title: '  ' }, null, [])).toEqual({ ok: false, problem: null });
    expect(decide({ ...found, items: [item({ title: '' })] }, null, [])).toEqual({
      ok: false,
      problem: null,
    });
  });
});
