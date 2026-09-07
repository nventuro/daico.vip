import { describe, it, expect } from 'vitest';
import {
  MIXED_EMAIL,
  MIXED_EMAIL_ADVICE,
  NO_BOARDING_PASS_FILE,
  NO_BOARDING_PASS_FILE_ADVICE,
  decide,
  rowsFromExtraction,
  type ExtractedItem,
  type Extraction,
} from './extract';

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
    files: [],
    ...overrides,
  };
}

/** The ids the email's files would be staged under, one per file, in order. */
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

  it('nulls a day or an hour there is not, however well it is written', () => {
    const [row] = rowsFromExtraction(
      [item({ on_date: '2026-02-31', at_time: '24:00', ends_on: '2026-13-01', ends_at: '12:60' })],
      'Bariloche',
      null,
      [],
    );
    expect(row.on_date).toBeNull();
    expect(row.at_time).toBeNull();
    expect(row.ends_on).toBeNull();
    expect(row.ends_at).toBeNull();
    const [leap] = rowsFromExtraction([item({ on_date: '2028-02-29' })], 'Bariloche', null, []);
    expect(leap.on_date).toBe('2028-02-29');
  });

  it('keeps an airport code only as three letters, in capitals', () => {
    const [row] = rowsFromExtraction(
      [item({ from_code: ' aep ', to_code: 'Bariloche' })],
      'Bariloche',
      null,
      [],
    );
    expect(row.from_code).toBe('AEP');
    expect(row.to_code).toBeNull();
  });

  it('cuts a title and a comment to length: they are written as they come', () => {
    const [row] = rowsFromExtraction(
      [item({ title: 'x'.repeat(500), comments: 'y'.repeat(5000) })],
      'Bariloche',
      null,
      [],
    );
    expect(row.title).toHaveLength(120);
    expect(row.comments).toHaveLength(1000);
  });

  it("turns an item's file numbers into the ids of those files, in the email's order", () => {
    const [row] = rowsFromExtraction([item({ files: [3, 1] })], 'Bariloche', null, FILE_IDS);
    expect(row.file_ids).toEqual(['file-1', 'file-3']);
  });

  it('drops a number that names no file and counts one named twice once', () => {
    const [row] = rowsFromExtraction(
      [item({ files: [0, 2, 4, 2, -1, 1.5] })],
      'Bariloche',
      null,
      FILE_IDS,
    );
    expect(row.file_ids).toEqual(['file-2']);
  });

  it('names no file when the model named none, or the email had none', () => {
    const [none] = rowsFromExtraction([item({ files: [] })], 'Bariloche', null, FILE_IDS);
    expect(none.file_ids).toEqual([]);
    const [noFiles] = rowsFromExtraction([item({ files: [1] })], 'Bariloche', null, []);
    expect(noFiles.file_ids).toEqual([]);
  });

  it('lets one file belong to several rows', () => {
    const rows = rowsFromExtraction(
      [item({ files: [1] }), item({ title: 'AR 1425', files: [1] })],
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

  it('carries the file ids through to the rows', () => {
    const decision = decide({ ...found, items: [item({ files: [2] })] }, null, FILE_IDS);
    expect(decision.ok).toBe(true);
    if (decision.ok) expect(decision.rows[0].file_ids).toEqual(['file-2']);
  });

  it("cuts the trip's name to length and keeps no address in the model's words", () => {
    const long = decide({ trip_title: 'x'.repeat(200), problem: null, items: [item()] }, null, []);
    expect(long.ok && long.tripTitle).toHaveLength(80);
    const said = decide(
      { trip_title: null, problem: 'Entrá a https://evil.example/x y cargá la tarjeta', items: [] },
      null,
      [],
    );
    expect(!said.ok && said.problem).not.toContain('https');
    expect(!said.ok && said.problem).toContain('Entrá a');
    const endless = decide({ trip_title: null, problem: 'p'.repeat(1000), items: [] }, null, []);
    expect(!endless.ok && endless.problem).toHaveLength(300);
  });

  it('fails with the problem the model reported', () => {
    const decision = decide({ ...found, problem: 'Es un recibo, no una confirmación.' }, null, []);
    expect(decision).toEqual({ ok: false, problem: 'Es un recibo, no una confirmación.' });
  });

  it('stages a boarding pass with its files, as its flight, and drops one that came with no file', () => {
    const pass = item({ kind: 'boarding_pass', files: [1, 2], comments: 'Ana 14A · Bruno 14B' });
    const decision = decide(
      { ...found, items: [pass, item({ kind: 'boarding_pass', title: 'AR 1425' })] },
      null,
      FILE_IDS,
    );
    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.rows).toHaveLength(1);
      expect(decision.rows[0]).toMatchObject({
        kind: 'boarding_pass',
        title: 'AR 1420',
        on_date: '2026-09-12',
        at_time: '08:40',
        from_code: 'AEP',
        to_code: 'BRC',
        file_ids: ['file-1', 'file-2'],
      });
    }
  });

  it('refuses a boarding pass that came as no file at all, saying what to do instead', () => {
    const decision = decide({ ...found, items: [item({ kind: 'boarding_pass' })] }, null, FILE_IDS);
    expect(decision).toEqual({
      ok: false,
      problem: NO_BOARDING_PASS_FILE,
      advice: NO_BOARDING_PASS_FILE_ADVICE,
    });
  });

  it('refuses an email that is bookings and a boarding pass at once', () => {
    const decision = decide(
      { ...found, items: [item(), item({ kind: 'boarding_pass', files: [1] })] },
      null,
      FILE_IDS,
    );
    expect(decision).toEqual({ ok: false, problem: MIXED_EMAIL, advice: MIXED_EMAIL_ADVICE });
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
