import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ATTACHMENT_LIST_PAGE,
  ATTACHMENT_ORPHAN_MIN_AGE_MS,
  ATTACHMENTS_BUCKET,
} from './attachmentFiles';
import { ATTACHMENTS_SPEC } from './offline/specs';
import { server } from './offline/testing/fakeSupabase';
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

/** An attachment as the app adds one: the file first, then its row. */
async function added(id: string, content = 'abc'): Promise<void> {
  await putAttachmentFile(id, bytes(content), false);
  await engine.insert(ATTACHMENTS_SPEC, row, id);
}

const uploads = () => server.calls.filter((c) => c.op === 'upload').length;

/** A run in which the attachments table came down, as a healthy one does. */
const pulled = new Set([ATTACHMENTS_SPEC.table]);

let warn: ReturnType<typeof vi.spyOn>;

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
    await added('a', 'abc');
    await uploadPending();
    expect(server.objects(ATTACHMENTS_BUCKET)).toEqual([
      { name: 'a', data: bytes('abc'), created_at: T0 },
    ]);
    expect(await attachmentUploadState('a')).toBe('uploaded');
    await uploadPending();
    expect(uploads()).toBe(1);
  });

  it('treats an object already in the bucket as uploaded', async () => {
    server.seedObjects(ATTACHMENTS_BUCKET, [{ name: 'a', data: bytes('abc'), created_at: T0 }]);
    await added('a');
    await uploadPending();
    expect(await attachmentUploadState('a')).toBe('uploaded');
  });

  it('gives up on a file the bucket refuses for good and never sends it again', async () => {
    await added('big');
    await added('fine');
    server.fail('upload', ATTACHMENTS_BUCKET, 'Payload too large', { status: 413 });
    await uploadPending();
    expect(await attachmentUploadState('big')).toBe('failed');
    expect(await attachmentUploadState('fine')).toBe('failed');
    server.restore();
    const before = uploads();
    await uploadPending();
    expect(uploads()).toBe(before);
  });

  it('sends what is still waiting and nothing else: not one the bucket has, nor one it refused', async () => {
    await added('refused');
    server.fail('upload', ATTACHMENTS_BUCKET, 'Payload too large', { status: 413 });
    await uploadPending();
    server.restore();
    await putAttachmentFile('held', bytes('xyz'), true);
    await added('waiting');

    const before = uploads();
    await uploadPending();

    expect(uploads()).toBe(before + 1);
    expect(await attachmentUploadState('waiting')).toBe('uploaded');
    expect(await attachmentUploadState('held')).toBe('uploaded');
    expect(await attachmentUploadState('refused')).toBe('failed');
  });

  it('keeps a file queued through a failure that may pass later', async () => {
    await added('a');
    server.fail('upload', ATTACHMENTS_BUCKET, 'network down');
    await expect(uploadPending()).rejects.toThrow('network down');
    expect(await attachmentUploadState('a')).toBe('pending');
    server.restore();
    await uploadPending();
    expect(await attachmentUploadState('a')).toBe('uploaded');
  });

  it('keeps a file queued while the session is rejected', async () => {
    await added('a');
    server.fail('upload', ATTACHMENTS_BUCKET, 'JWT expired', { status: 401 });
    await expect(uploadPending()).rejects.toThrow();
    expect(await attachmentUploadState('a')).toBe('pending');
  });
});

describe('fetchAttachmentFile', () => {
  it('downloads once and serves the local copy from then on', async () => {
    server.seedObjects(ATTACHMENTS_BUCKET, [{ name: 'a', data: bytes('abc'), created_at: T0 }]);
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
    server.seedObjects(ATTACHMENTS_BUCKET, [{ name: 'a', data: bytes('abc'), created_at: T0 }]);
    server.fail('download', ATTACHMENTS_BUCKET, 'network down');
    expect(await fetchAttachmentFile('a')).toBeNull();
    expect(await localAttachmentFile('a')).toBeNull();
    server.restore();
    expect(await fetchAttachmentFile('a')).toEqual(bytes('abc'));
  });
});

describe('syncAttachmentFiles', () => {
  it('removes old objects no attachment refers to and keeps every other one', async () => {
    const old = new Date(Date.parse(T0) - 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString();
    server.seedObjects(ATTACHMENTS_BUCKET, [
      { name: 'old-orphan', data: bytes('x'), created_at: old },
      { name: 'young-orphan', data: bytes('x'), created_at: T0 },
      { name: 'old-kept', data: bytes('x'), created_at: old },
    ]);
    await engine.insert(ATTACHMENTS_SPEC, row, 'old-kept');
    await syncAttachmentFiles(pulled);
    expect(server.objects(ATTACHMENTS_BUCKET).map((o) => o.name)).toEqual([
      'young-orphan',
      'old-kept',
    ]);
  });

  it("keeps every kept kind's file on this device — a document's, a trip row's — and no other", async () => {
    server.seedObjects(ATTACHMENTS_BUCKET, [
      { name: 'doc', data: bytes('doc'), created_at: T0 },
      { name: 'trip', data: bytes('trip'), created_at: T0 },
      { name: 'chore', data: bytes('chore'), created_at: T0 },
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

  it("leaves a document's file the bucket does not have yet for a later run", async () => {
    server.seedObjects(ATTACHMENTS_BUCKET, [{ name: 'now', data: bytes('now'), created_at: T0 }]);
    await engine.insert(ATTACHMENTS_SPEC, documentRow, 'later');
    await engine.insert(ATTACHMENTS_SPEC, documentRow, 'now');
    await syncAttachmentFiles(pulled);
    expect(await localAttachmentFile('now')).toEqual(bytes('now'));
    expect(await localAttachmentFile('later')).toBeNull();
    server.seedObjects(ATTACHMENTS_BUCKET, [
      { name: 'later', data: bytes('later'), created_at: T0 },
    ]);
    await syncAttachmentFiles(pulled);
    expect(await localAttachmentFile('later')).toEqual(bytes('later'));
  });

  it('leaves the fetch of document files for the next run when the bucket is unreachable', async () => {
    server.seedObjects(ATTACHMENTS_BUCKET, [{ name: 'doc', data: bytes('doc'), created_at: T0 }]);
    await engine.insert(ATTACHMENTS_SPEC, documentRow, 'doc');
    server.fail('download', ATTACHMENTS_BUCKET, 'network down');
    await expect(syncAttachmentFiles(pulled)).rejects.toThrow('network down');
    expect(await localAttachmentFile('doc')).toBeNull();
    server.restore();
    await syncAttachmentFiles(pulled);
    expect(await localAttachmentFile('doc')).toEqual(bytes('doc'));
  });

  it('does not sweep when the attachments table did not come down in the run', async () => {
    const old = new Date(Date.parse(T0) - 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString();
    server.seedObjects(ATTACHMENTS_BUCKET, [{ name: 'a', data: bytes('x'), created_at: old }]);
    await engine.insert(ATTACHMENTS_SPEC, row, 'other');
    await syncAttachmentFiles(new Set(['chores']));
    expect(server.objects(ATTACHMENTS_BUCKET).map((o) => o.name)).toEqual(['a']);
    await syncAttachmentFiles(pulled);
    expect(server.objects(ATTACHMENTS_BUCKET)).toEqual([]);
  });

  it('does not sweep when this device holds no attachment at all', async () => {
    const old = new Date(Date.parse(T0) - 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString();
    server.seedObjects(ATTACHMENTS_BUCKET, [{ name: 'a', data: bytes('x'), created_at: old }]);
    await syncAttachmentFiles(pulled);
    expect(server.objects(ATTACHMENTS_BUCKET).map((o) => o.name)).toEqual(['a']);
  });

  it('sweeps nothing after a sync in which the attachments table failed', async () => {
    const stop = afterSync(syncAttachmentFiles);
    try {
      const old = new Date(Date.parse(T0) - 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString();
      server.seedObjects(ATTACHMENTS_BUCKET, [{ name: 'a', data: bytes('x'), created_at: old }]);
      await engine.insert(ATTACHMENTS_SPEC, row, 'kept');
      server.fail('select', 'attachments', 'network down');
      await syncAll();
      expect(server.objects(ATTACHMENTS_BUCKET).map((o) => o.name)).toEqual(['a']);
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
    expect(server.objects(ATTACHMENTS_BUCKET).map((o) => o.name)).toEqual(['a']);
    expect(await attachmentUploadState('a')).toBe('uploaded');
  });

  it('keeps an object exactly as old as the grace period, and one of no known age', async () => {
    const ago = (ms: number) => new Date(Date.parse(T0) - ms).toISOString();
    server.seedObjects(ATTACHMENTS_BUCKET, [
      { name: 'at-cutoff', data: bytes('x'), created_at: ago(ATTACHMENT_ORPHAN_MIN_AGE_MS) },
      { name: 'ageless', data: bytes('x'), created_at: null },
      {
        name: 'a-moment-older',
        data: bytes('x'),
        created_at: ago(ATTACHMENT_ORPHAN_MIN_AGE_MS + 1),
      },
    ]);
    await engine.insert(ATTACHMENTS_SPEC, row, 'kept');
    await syncAttachmentFiles(pulled);
    expect(server.objects(ATTACHMENTS_BUCKET).map((o) => o.name)).toEqual(['at-cutoff', 'ageless']);
  });

  it('reads the bucket past its first page, and sweeps by every page of it', async () => {
    const old = new Date(Date.parse(T0) - 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString();
    const last = `object-${ATTACHMENT_LIST_PAGE}`;
    server.seedObjects(
      ATTACHMENTS_BUCKET,
      Array.from({ length: ATTACHMENT_LIST_PAGE + 1 }, (_, i) => ({
        name: `object-${i}`,
        data: bytes('x'),
        created_at: old,
      })),
    );
    // The household's one attachment is the object listed last, a page in.
    await engine.insert(ATTACHMENTS_SPEC, row, last);
    await syncAttachmentFiles(pulled);
    expect(server.objects(ATTACHMENTS_BUCKET).map((o) => o.name)).toEqual([last]);
    expect(server.calls.filter((c) => c.op === 'list')).toHaveLength(2);
  });

  it('keeps the file of an attachment whose delete the server will not take', async () => {
    const stop = afterSync(syncAttachmentFiles);
    try {
      await added('a');
      await added('b');
      await syncAll();
      expect(server.objects(ATTACHMENTS_BUCKET).map((o) => o.name)).toEqual(['a', 'b']);

      // Deleted here, and the server refuses the delete for good: every other
      // device keeps the row, so the file has to stay.
      await engine.remove(ATTACHMENTS_SPEC, 'a');
      server.fail('delete', 'attachments', 'row-level security', { code: '42501' });
      at(new Date(Date.parse(T0) + 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString());
      await syncAll();

      expect(server.objects(ATTACHMENTS_BUCKET).map((o) => o.name)).toEqual(['a', 'b']);
    } finally {
      stop();
    }
  });

  it('stops at a bucket that cannot be listed or swept, leaving the objects alone', async () => {
    const old = new Date(Date.parse(T0) - 2 * ATTACHMENT_ORPHAN_MIN_AGE_MS).toISOString();
    server.seedObjects(ATTACHMENTS_BUCKET, [
      { name: 'orphan', data: bytes('x'), created_at: old },
      { name: 'kept', data: bytes('x'), created_at: old },
    ]);
    await engine.insert(ATTACHMENTS_SPEC, row, 'kept');

    server.fail('list', ATTACHMENTS_BUCKET, 'network down');
    await expect(syncAttachmentFiles(pulled)).rejects.toThrow('network down');
    server.restore();

    server.fail('remove', ATTACHMENTS_BUCKET, 'network down');
    await expect(syncAttachmentFiles(pulled)).rejects.toThrow('network down');
    server.restore();

    expect(server.objects(ATTACHMENTS_BUCKET).map((o) => o.name)).toEqual(['orphan', 'kept']);
    await syncAttachmentFiles(pulled);
    expect(server.objects(ATTACHMENTS_BUCKET).map((o) => o.name)).toEqual(['kept']);
  });

  it('a failure in the file work is logged and leaves the queue for next time', async () => {
    const stop = afterSync(syncAttachmentFiles);
    try {
      await added('a');
      server.fail('upload', ATTACHMENTS_BUCKET, 'network down');
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

  it('says what the files come to and how many are still waiting', async () => {
    await threeFiles();
    expect(await attachmentFileUsage()).toEqual({
      bytes: 15,
      keptBytes: 7,
      waiting: 1,
      failed: 0,
    });

    server.fail('upload', ATTACHMENTS_BUCKET, 'Payload too large', { status: 413 });
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
