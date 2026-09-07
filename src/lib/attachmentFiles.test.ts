import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { ATTACHMENT_ORPHAN_MIN_AGE_MS, TRIP_FILES_KEPT_DAYS } from './attachmentFiles';
import { ATTACHMENTS_SPEC, TRIP_ITEMS_SPEC, TRIPS_SPEC } from './offline/specs';
import { addDays, todayIso } from '../utils/dateUtils';
import { FILES, FILES_LIST_PAGE, server } from './offline/testing/fakeSupabase';
import { T0, at, network } from './offline/testing/clock';
import * as engine from './offline/engine';
import { afterSync, syncAll } from './offline/sync';
import {
  attachmentFileUsage,
  attachmentProblem,
  attachmentType,
  attachmentUploadState,
  dropCachedFiles,
  fetchAttachmentFile,
  isPdf,
  localAttachmentFile,
  putAttachmentFile,
  syncAttachmentFiles,
  uploadPending,
} from './attachmentFiles';

vi.mock('sqlocal', () => import('./offline/testing/sqlocalInMemory'));
vi.mock('./supabase', () => import('./offline/testing/fakeSupabase'));

const bytes = (text: string) => new TextEncoder().encode(text);
const row = {
  owner_kind: 'chore' as const,
  owner_id: 'c1',
  name: '',
  mime: 'image/png',
  size: 3,
  wrapped_file_key: 'k',
};
const documentRow = { ...row, owner_kind: 'document' as const, owner_id: 'd1' };
const tripRow = { ...row, owner_kind: 'trip_item' as const, owner_id: 't1' };
const passRow = { ...row, owner_kind: 'boarding_pass' as const, owner_id: 't1' };
const tripItem = {
  trip_id: '',
  kind: 'lodging' as const,
  title: '',
  on_date: null,
  at_time: null,
  ends_on: null,
  ends_at: null,
  from_code: null,
  to_code: null,
  done: false,
  comments: null,
};

/** An attachment as the app adds one: the file first, then its row. */
async function added(id: string, content = 'abc'): Promise<void> {
  await putAttachmentFile(id, bytes(content), false);
  await engine.insert(ATTACHMENTS_SPEC, row, id);
}

/** One added and its row pushed, as the run that uploads the file has done
 *  by the time it gets to the files. */
async function pushed(id: string, content = 'abc'): Promise<void> {
  await added(id, content);
  await syncAll();
}

/** A trip whose last day is `endsOn`, one row of it (`<tripId>-row`), and the
 *  row's attachment `attachmentId`, its file not yet on this device. */
async function tripWithFile(
  tripId: string,
  endsOn: string | null,
  attachmentId: string,
): Promise<void> {
  await engine.insert(TRIPS_SPEC, { title: tripId, starts_on: null, ends_on: endsOn }, tripId);
  await engine.insert(TRIP_ITEMS_SPEC, { ...tripItem, trip_id: tripId }, `${tripId}-row`);
  await engine.insert(ATTACHMENTS_SPEC, { ...tripRow, owner_id: `${tripId}-row` }, attachmentId);
}

/** The last day a trip may have ended on and still have its files kept. */
const lastKeptDay = () => addDays(todayIso(), -TRIP_FILES_KEPT_DAYS);

const uploads = () => server.calls.filter((c) => c.op === 'upload').length;

/** A run in which the attachments table came down, as a healthy one does. */
const pulled = new Set([ATTACHMENTS_SPEC.table]);

let warn: MockInstance<typeof console.warn>;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  at(T0);
  network.online = true;
  server.reset();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  await engine.clearAll();
});

afterEach(() => {
  warn.mockRestore();
  vi.useRealTimers();
});

describe('the local file cache', () => {
  it('keeps a file as bytes and knows whether the bucket has it', async () => {
    await putAttachmentFile('a', bytes('abc'), false);
    await putAttachmentFile('b', bytes('xyz'), true);
    expect(await localAttachmentFile('a')).toEqual(bytes('abc'));
    expect(await localAttachmentFile('missing')).toBeNull();
    expect(await attachmentUploadState('a')).toBe('pending');
    expect(await attachmentUploadState('b')).toBe('uploaded');
    expect(await attachmentUploadState('missing')).toBeNull();
  });

  it('prunes the files of attachments that no longer exist', async () => {
    await added('kept');
    await putAttachmentFile('orphan', bytes('abc'), true);
    await syncAttachmentFiles(pulled);
    expect(await localAttachmentFile('kept')).not.toBeNull();
    expect(await localAttachmentFile('orphan')).toBeNull();
  });

  it('is wiped with everything else', async () => {
    await putAttachmentFile('a', bytes('abc'), true);
    await engine.clearAll();
    expect(await localAttachmentFile('a')).toBeNull();
  });
});

describe('uploadPending', () => {
  it('sends each waiting file to the bucket as an opaque blob and marks it uploaded', async () => {
    await pushed('a', 'abc');
    await uploadPending();
    expect(server.files()).toEqual([{ name: 'a', data: bytes('abc'), uploaded: T0 }]);
    expect(await attachmentUploadState('a')).toBe('uploaded');
    await uploadPending();
    expect(uploads()).toBe(1);
  });

  it('sends a file the bucket already has again — the same bytes under the same id', async () => {
    server.seedFiles([{ name: 'a', data: bytes('abc'), uploaded: T0 }]);
    await pushed('a');
    await uploadPending();
    expect(await attachmentUploadState('a')).toBe('uploaded');
    expect(server.files()).toEqual([{ name: 'a', data: bytes('abc'), uploaded: T0 }]);
  });

  it('gives up on a file the bucket refuses for good and never sends it again', async () => {
    await pushed('big');
    await pushed('fine');
    server.fail('upload', FILES, 'Payload too large', { status: 413 });
    await uploadPending();
    expect(await attachmentUploadState('big')).toBe('failed');
    expect(await attachmentUploadState('fine')).toBe('failed');
    server.restore();
    const before = uploads();
    await uploadPending();
    expect(uploads()).toBe(before);
  });

  it('sends what is still waiting and nothing else: not one the bucket has, nor one it refused', async () => {
    await pushed('refused');
    server.fail('upload', FILES, 'Payload too large', { status: 413 });
    await uploadPending();
    server.restore();
    await putAttachmentFile('held', bytes('xyz'), true);
    await pushed('waiting');

    const before = uploads();
    await uploadPending();

    expect(uploads()).toBe(before + 1);
    expect(await attachmentUploadState('waiting')).toBe('uploaded');
    expect(await attachmentUploadState('held')).toBe('uploaded');
    expect(await attachmentUploadState('refused')).toBe('failed');
  });

  it('keeps a file queued through a failure that may pass later', async () => {
    await pushed('a');
    server.fail('upload', FILES, 'network down');
    await expect(uploadPending()).rejects.toThrow('network down');
    expect(await attachmentUploadState('a')).toBe('pending');
    server.restore();
    await uploadPending();
    expect(await attachmentUploadState('a')).toBe('uploaded');
  });

  it('keeps a file queued while the session is rejected', async () => {
    await pushed('a');
    server.fail('upload', FILES, 'JWT expired', { status: 401 });
    await expect(uploadPending()).rejects.toThrow();
    expect(await attachmentUploadState('a')).toBe('pending');
  });

  it('leaves a file whose row the server has not taken yet', async () => {
    await added('a');
    await uploadPending();
    expect(uploads()).toBe(0);
    expect(await attachmentUploadState('a')).toBe('pending');
    await syncAll();
    await uploadPending();
    expect(await attachmentUploadState('a')).toBe('uploaded');
  });
});

describe('fetchAttachmentFile', () => {
  it('downloads once and serves the local copy from then on', async () => {
    server.seedFiles([{ name: 'a', data: bytes('abc'), uploaded: T0 }]);
    expect(await fetchAttachmentFile('a')).toEqual(bytes('abc'));
    expect(await attachmentUploadState('a')).toBe('uploaded');
    network.online = false;
    expect(await fetchAttachmentFile('a')).toEqual(bytes('abc'));
    expect(server.calls.filter((c) => c.op === 'download')).toHaveLength(1);
  });

  it('is null for a file the bucket does not have yet, or with no connection', async () => {
    expect(await fetchAttachmentFile('a')).toBeNull();
    network.online = false;
    expect(await fetchAttachmentFile('b')).toBeNull();
    expect(server.calls.filter((c) => c.op === 'download')).toHaveLength(1);
  });

  it('is null when the download fails, and keeps nothing from it', async () => {
    server.seedFiles([{ name: 'a', data: bytes('abc'), uploaded: T0 }]);
    server.fail('download', FILES, 'network down');
    expect(await fetchAttachmentFile('a')).toBeNull();
    expect(await localAttachmentFile('a')).toBeNull();
    server.restore();
    expect(await fetchAttachmentFile('a')).toEqual(bytes('abc'));
  });
});

describe('syncAttachmentFiles', () => {
  it('removes old objects no attachment refers to and keeps every other one', async () => {
    const old = new Date(Date.parse(T0) - 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString();
    server.seedFiles([
      { name: 'old-orphan', data: bytes('x'), uploaded: old },
      { name: 'young-orphan', data: bytes('x'), uploaded: T0 },
      { name: 'old-kept', data: bytes('x'), uploaded: old },
    ]);
    await engine.insert(ATTACHMENTS_SPEC, row, 'old-kept');
    await syncAttachmentFiles(pulled);
    expect(server.files().map((o) => o.name)).toEqual(['young-orphan', 'old-kept']);
  });

  it("keeps every kept kind's file on this device — a document's, a trip row's — and no other", async () => {
    server.seedFiles([
      { name: 'doc', data: bytes('doc'), uploaded: T0 },
      { name: 'trip', data: bytes('trip'), uploaded: T0 },
      { name: 'chore', data: bytes('chore'), uploaded: T0 },
    ]);
    await engine.insert(ATTACHMENTS_SPEC, documentRow, 'doc');
    await engine.insert(ATTACHMENTS_SPEC, tripRow, 'trip');
    await engine.insert(ATTACHMENTS_SPEC, row, 'chore');
    await syncAttachmentFiles(pulled);
    expect(await localAttachmentFile('doc')).toEqual(bytes('doc'));
    expect(await attachmentUploadState('doc')).toBe('uploaded');
    expect(await localAttachmentFile('trip')).toEqual(bytes('trip'));
    expect(await localAttachmentFile('chore')).toBeNull();
    await syncAttachmentFiles(pulled);
    expect(server.calls.filter((c) => c.op === 'download')).toHaveLength(2);
  });

  it("fetches a trip row's file only while its trip is not over — a week past its last day", async () => {
    const names = ['over', 'edge', 'undated', 'unknown'];
    server.seedFiles(names.map((name) => ({ name, data: bytes(name), uploaded: T0 })));
    await tripWithFile('over', addDays(lastKeptDay(), -1), 'over');
    await tripWithFile('edge', lastKeptDay(), 'edge');
    await tripWithFile('undated', null, 'undated');
    // A row this device has not got yet may be of a trip still to come.
    await engine.insert(ATTACHMENTS_SPEC, { ...tripRow, owner_id: 'no-such-row' }, 'unknown');
    await syncAttachmentFiles(pulled);
    expect(await localAttachmentFile('over')).toBeNull();
    expect(await localAttachmentFile('edge')).toEqual(bytes('edge'));
    expect(await localAttachmentFile('undated')).toEqual(bytes('undated'));
    expect(await localAttachmentFile('unknown')).toEqual(bytes('unknown'));
  });

  it("keeps a flight's boarding pass like the flight's other files: on every device until its trip is over", async () => {
    server.seedFiles([
      { name: 'pass', data: bytes('pass'), uploaded: T0 },
      { name: 'old-pass', data: bytes('old'), uploaded: T0 },
      { name: 'unknown-pass', data: bytes('unknown'), uploaded: T0 },
    ]);
    await tripWithFile('ahead', null, 'ticket');
    await engine.insert(ATTACHMENTS_SPEC, { ...passRow, owner_id: 'ahead-row' }, 'pass');
    await tripWithFile('over', addDays(lastKeptDay(), -1), 'old-ticket');
    await engine.insert(ATTACHMENTS_SPEC, { ...passRow, owner_id: 'over-row' }, 'old-pass');
    await engine.insert(ATTACHMENTS_SPEC, { ...passRow, owner_id: 'no-such-row' }, 'unknown-pass');
    await syncAttachmentFiles(pulled);
    expect(await localAttachmentFile('pass')).toEqual(bytes('pass'));
    expect(await localAttachmentFile('old-pass')).toBeNull();
    expect(await localAttachmentFile('unknown-pass')).toEqual(bytes('unknown'));
  });

  it("leaves a past trip's file this device holds where it is, and fetches again once its last day moves", async () => {
    server.seedFiles([
      { name: 'held', data: bytes('held'), uploaded: T0 },
      { name: 'later', data: bytes('later'), uploaded: T0 },
    ]);
    await tripWithFile('past', addDays(lastKeptDay(), -1), 'held');
    await putAttachmentFile('held', bytes('held'), true);
    await engine.insert(ATTACHMENTS_SPEC, { ...tripRow, owner_id: 'past-row' }, 'later');
    await syncAttachmentFiles(pulled);
    expect(await localAttachmentFile('held')).toEqual(bytes('held'));
    expect(await localAttachmentFile('later')).toBeNull();
    expect(server.calls.filter((c) => c.op === 'download')).toHaveLength(0);

    await engine.update(TRIPS_SPEC, 'past', { ends_on: todayIso() });
    await syncAttachmentFiles(pulled);
    expect(await localAttachmentFile('later')).toEqual(bytes('later'));
  });

  it("leaves a document's file the bucket does not have yet for a later run", async () => {
    server.seedFiles([{ name: 'now', data: bytes('now'), uploaded: T0 }]);
    await engine.insert(ATTACHMENTS_SPEC, documentRow, 'later');
    await engine.insert(ATTACHMENTS_SPEC, documentRow, 'now');
    await syncAttachmentFiles(pulled);
    expect(await localAttachmentFile('now')).toEqual(bytes('now'));
    expect(await localAttachmentFile('later')).toBeNull();
    server.seedFiles([{ name: 'later', data: bytes('later'), uploaded: T0 }]);
    await syncAttachmentFiles(pulled);
    expect(await localAttachmentFile('later')).toEqual(bytes('later'));
  });

  it('leaves the fetch of document files for the next run when the bucket is unreachable', async () => {
    server.seedFiles([{ name: 'doc', data: bytes('doc'), uploaded: T0 }]);
    await engine.insert(ATTACHMENTS_SPEC, documentRow, 'doc');
    server.fail('download', FILES, 'network down');
    await expect(syncAttachmentFiles(pulled)).rejects.toThrow('network down');
    expect(await localAttachmentFile('doc')).toBeNull();
    server.restore();
    await syncAttachmentFiles(pulled);
    expect(await localAttachmentFile('doc')).toEqual(bytes('doc'));
  });

  it('does not sweep when the attachments table did not come down in the run', async () => {
    const old = new Date(Date.parse(T0) - 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString();
    server.seedFiles([{ name: 'a', data: bytes('x'), uploaded: old }]);
    await engine.insert(ATTACHMENTS_SPEC, row, 'other');
    await syncAttachmentFiles(new Set(['chores']));
    expect(server.files().map((o) => o.name)).toEqual(['a']);
    await syncAttachmentFiles(pulled);
    expect(server.files()).toEqual([]);
  });

  it('does not sweep when this device holds no attachment at all', async () => {
    const old = new Date(Date.parse(T0) - 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString();
    server.seedFiles([{ name: 'a', data: bytes('x'), uploaded: old }]);
    await syncAttachmentFiles(pulled);
    expect(server.files().map((o) => o.name)).toEqual(['a']);
  });

  it('sweeps nothing after a sync in which the attachments table failed', async () => {
    const stop = afterSync(syncAttachmentFiles);
    try {
      const old = new Date(Date.parse(T0) - 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString();
      server.seedFiles([{ name: 'a', data: bytes('x'), uploaded: old }]);
      await engine.insert(ATTACHMENTS_SPEC, row, 'kept');
      server.fail('select', 'attachments', 'network down');
      await syncAll();
      expect(server.files().map((o) => o.name)).toEqual(['a']);
    } finally {
      stop();
    }
  });

  it('runs at the end of a sync when registered, so a new attachment reaches both places', async () => {
    const stop = afterSync(syncAttachmentFiles);
    try {
      await added('a', 'abc');
      await syncAll();
    } finally {
      stop();
    }
    expect(server.rows('attachments').map((r) => r.id)).toEqual(['a']);
    expect(server.files().map((o) => o.name)).toEqual(['a']);
    expect(await attachmentUploadState('a')).toBe('uploaded');
  });

  it('holds a file back until the server takes its row, so no sweep can take it for an orphan', async () => {
    const stop = afterSync(syncAttachmentFiles);
    try {
      await added('a');
      server.fail('upsert', 'attachments', 'network down');
      await syncAll();
      expect(server.files()).toEqual([]);
      expect(await attachmentUploadState('a')).toBe('pending');

      server.restore();
      await syncAll();
      expect(server.rows('attachments').map((r) => r.id)).toEqual(['a']);
      expect(server.files().map((o) => o.name)).toEqual(['a']);
      expect(await attachmentUploadState('a')).toBe('uploaded');
    } finally {
      stop();
    }
  });

  it('keeps an object exactly as old as the grace period', async () => {
    const ago = (ms: number) => new Date(Date.parse(T0) - ms).toISOString();
    server.seedFiles([
      { name: 'at-cutoff', data: bytes('x'), uploaded: ago(ATTACHMENT_ORPHAN_MIN_AGE_MS) },
      {
        name: 'a-moment-older',
        data: bytes('x'),
        uploaded: ago(ATTACHMENT_ORPHAN_MIN_AGE_MS + 1),
      },
    ]);
    await engine.insert(ATTACHMENTS_SPEC, row, 'kept');
    await syncAttachmentFiles(pulled);
    expect(server.files().map((o) => o.name)).toEqual(['at-cutoff']);
  });

  it('reads the bucket past its first page, and sweeps by every page of it', async () => {
    const old = new Date(Date.parse(T0) - 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString();
    const last = `object-${FILES_LIST_PAGE}`;
    server.seedFiles(
      Array.from({ length: FILES_LIST_PAGE + 1 }, (_, i) => ({
        name: `object-${i}`,
        data: bytes('x'),
        uploaded: old,
      })),
    );
    // The household's one attachment is the object listed last, a page in.
    await engine.insert(ATTACHMENTS_SPEC, row, last);
    await syncAttachmentFiles(pulled);
    expect(server.files().map((o) => o.name)).toEqual([last]);
    expect(server.calls.filter((c) => c.op === 'list')).toHaveLength(2);
  });

  it('keeps the file of an attachment whose delete the server will not take', async () => {
    const stop = afterSync(syncAttachmentFiles);
    try {
      await added('a');
      await added('b');
      await syncAll();
      expect(server.files().map((o) => o.name)).toEqual(['a', 'b']);

      // Deleted here, and the server refuses the delete for good: every other
      // device keeps the row, so the file has to stay.
      await engine.remove(ATTACHMENTS_SPEC, 'a');
      server.fail('delete', 'attachments', 'row-level security', { code: '42501' });
      at(new Date(Date.parse(T0) + 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString());
      await syncAll();

      expect(server.files().map((o) => o.name)).toEqual(['a', 'b']);
    } finally {
      stop();
    }
  });

  it('stops at a bucket that cannot be listed or swept, leaving the objects alone', async () => {
    const old = new Date(Date.parse(T0) - 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString();
    server.seedFiles([
      { name: 'orphan', data: bytes('x'), uploaded: old },
      { name: 'kept', data: bytes('x'), uploaded: old },
    ]);
    await engine.insert(ATTACHMENTS_SPEC, row, 'kept');

    server.fail('list', FILES, 'network down');
    await expect(syncAttachmentFiles(pulled)).rejects.toThrow('network down');
    server.restore();

    server.fail('remove', FILES, 'network down');
    await expect(syncAttachmentFiles(pulled)).rejects.toThrow('network down');
    server.restore();

    expect(server.files().map((o) => o.name)).toEqual(['orphan', 'kept']);
    await syncAttachmentFiles(pulled);
    expect(server.files().map((o) => o.name)).toEqual(['kept']);
  });

  it('a failure in the file work is logged and leaves the queue for next time', async () => {
    const stop = afterSync(syncAttachmentFiles);
    try {
      await added('a');
      server.fail('upload', FILES, 'network down');
      await syncAll();
      expect(warn).toHaveBeenCalled();
      expect(await attachmentUploadState('a')).toBe('pending');
      server.restore();
      await syncAll();
      expect(await attachmentUploadState('a')).toBe('uploaded');
    } finally {
      stop();
    }
  });
});

describe('making room', () => {
  /** A document's and a trip row's file the bucket has, a chore's the bucket
   *  has, and one the bucket has never seen. */
  async function threeFiles(): Promise<void> {
    await putAttachmentFile('doc', bytes('abc'), true);
    await engine.insert(ATTACHMENTS_SPEC, documentRow, 'doc');
    await putAttachmentFile('trip', bytes('abcd'), true);
    await engine.insert(ATTACHMENTS_SPEC, tripRow, 'trip');
    await putAttachmentFile('cached', bytes('abcdef'), true);
    await engine.insert(ATTACHMENTS_SPEC, row, 'cached');
    await putAttachmentFile('only-copy', bytes('ab'), false);
    await engine.insert(ATTACHMENTS_SPEC, row, 'only-copy');
  }

  it('drops what can be fetched again, and nothing else', async () => {
    await threeFiles();
    await dropCachedFiles();

    expect(await localAttachmentFile('cached')).toBeNull();
    // Every device keeps a document's and a trip row's, so the next sync
    // would fetch them straight back.
    expect(await localAttachmentFile('doc')).not.toBeNull();
    expect(await localAttachmentFile('trip')).not.toBeNull();
    // The bucket does not have this one: here is the only copy there is.
    expect(await localAttachmentFile('only-copy')).not.toBeNull();
  });

  it("drops a past trip's file, and counts it among what can be fetched again", async () => {
    await threeFiles();
    await tripWithFile('past', addDays(lastKeptDay(), -1), 'past');
    await putAttachmentFile('past', bytes('abcde'), true);
    expect(await attachmentFileUsage()).toMatchObject({ bytes: 20, keptBytes: 7 });

    await dropCachedFiles();
    expect(await localAttachmentFile('past')).toBeNull();
    expect(await localAttachmentFile('trip')).not.toBeNull();
  });

  it('says what the files come to and how many are still waiting', async () => {
    await threeFiles();
    expect(await attachmentFileUsage()).toEqual({
      bytes: 15,
      keptBytes: 7,
      waiting: 1,
      failed: 0,
    });

    await syncAll();
    server.fail('upload', FILES, 'Payload too large', { status: 413 });
    await uploadPending();
    expect(await attachmentFileUsage()).toMatchObject({ waiting: 1, failed: 1 });
  });
});

describe('what may be attached', () => {
  it('takes a picture or a PDF, by its type or by its extension alone', () => {
    expect(attachmentType(new File([], 'x.pdf', { type: 'application/pdf' }))).toBe(
      'application/pdf',
    );
    expect(attachmentType(new File([], 'RESULTADOS.PDF'))).toBe('application/pdf');
    expect(attachmentType(new File([], 'x.jpg', { type: 'image/jpg' }))).toBe('image/jpeg');
    expect(isPdf('application/pdf')).toBe(true);
    expect(isPdf('image/jpeg')).toBe(false);
  });

  it('refuses any other kind of file, saying what is taken', () => {
    const file = new File([], 'x.docx', { type: 'application/msword' });
    expect(attachmentType(file)).toBeNull();
    expect(attachmentProblem(file)).toContain('PDF');
  });
});
