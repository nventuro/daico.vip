import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ATTACHMENT_ORPHAN_MIN_AGE_MS, ATTACHMENTS_BUCKET } from '../types';
import { ATTACHMENTS_SPEC } from './offline/specs';
import { server } from './offline/testing/fakeSupabase';
import * as engine from './offline/engine';
import { afterSync, syncAll } from './offline/sync';
import { fetchAttachmentFile, syncAttachmentFiles, uploadPending } from './attachmentFiles';

vi.mock('sqlocal', () => import('./offline/testing/sqlocalInMemory'));
vi.mock('./supabase', () => import('./offline/testing/fakeSupabase'));

// Node's navigator has no `onLine`; the sync engine bails out without it.
let online = true;
Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });

const T0 = '2026-08-27T10:00:00.000Z';
const bytes = (text: string) => new TextEncoder().encode(text);
const row = {
  owner_kind: 'chore',
  owner_id: 'c1',
  name: '',
  mime: 'image/png',
  size: 3,
  wrapped_file_key: 'k',
};

/** An attachment as the app adds one: the file first, then its row. */
async function added(id: string, content = 'abc'): Promise<void> {
  await engine.putAttachmentFile(id, bytes(content), false);
  await engine.insert(ATTACHMENTS_SPEC, row, id);
}

const uploads = () => server.calls.filter((c) => c.op === 'upload').length;

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(T0));
  online = true;
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
    await engine.putAttachmentFile('a', bytes('abc'), false);
    await engine.putAttachmentFile('b', bytes('xyz'), true);
    expect(await engine.getAttachmentFile('a')).toEqual(bytes('abc'));
    expect(await engine.getAttachmentFile('missing')).toBeNull();
    expect(await engine.getAttachmentUploadState('a')).toBe('pending');
    expect(await engine.getAttachmentUploadState('b')).toBe('uploaded');
    expect(await engine.getAttachmentUploadState('missing')).toBeNull();
    expect((await engine.listPendingUploads()).map((f) => f.id)).toEqual(['a']);
  });

  it('takes a file out of the queue once uploaded or refused for good', async () => {
    await engine.putAttachmentFile('a', bytes('abc'), false);
    await engine.putAttachmentFile('b', bytes('abc'), false);
    await engine.markAttachmentUploaded('a');
    await engine.markAttachmentUploadFailed('b', 'too large');
    expect(await engine.getAttachmentUploadState('a')).toBe('uploaded');
    expect(await engine.getAttachmentUploadState('b')).toBe('failed');
    expect(await engine.listPendingUploads()).toEqual([]);
  });

  it('prunes the files of attachments that no longer exist', async () => {
    await added('kept');
    await engine.putAttachmentFile('orphan', bytes('abc'), true);
    await engine.pruneAttachmentFiles();
    expect(await engine.getAttachmentFile('kept')).not.toBeNull();
    expect(await engine.getAttachmentFile('orphan')).toBeNull();
  });

  it('is wiped with everything else', async () => {
    await engine.putAttachmentFile('a', bytes('abc'), true);
    await engine.clearAll();
    expect(await engine.getAttachmentFile('a')).toBeNull();
  });
});

describe('uploadPending', () => {
  it('sends each waiting file to the bucket as an opaque blob and marks it uploaded', async () => {
    await added('a', 'abc');
    await uploadPending();
    expect(server.objects(ATTACHMENTS_BUCKET)).toEqual([
      { name: 'a', data: bytes('abc'), created_at: T0 },
    ]);
    expect(await engine.getAttachmentUploadState('a')).toBe('uploaded');
    await uploadPending();
    expect(uploads()).toBe(1);
  });

  it('treats an object already in the bucket as uploaded', async () => {
    server.seedObjects(ATTACHMENTS_BUCKET, [{ name: 'a', data: bytes('abc'), created_at: T0 }]);
    await added('a');
    await uploadPending();
    expect(await engine.getAttachmentUploadState('a')).toBe('uploaded');
  });

  it('gives up on a file the bucket refuses for good, and only on that one', async () => {
    await added('big');
    await added('fine');
    server.fail('upload', ATTACHMENTS_BUCKET, 'Payload too large', 413);
    await uploadPending();
    expect(await engine.getAttachmentUploadState('big')).toBe('failed');
    expect(await engine.getAttachmentUploadState('fine')).toBe('failed');
    server.restore();
    const before = uploads();
    await uploadPending();
    expect(uploads()).toBe(before);
  });

  it('keeps a file queued through a failure that may pass later', async () => {
    await added('a');
    server.fail('upload', ATTACHMENTS_BUCKET, 'network down');
    await expect(uploadPending()).rejects.toThrow('network down');
    expect(await engine.getAttachmentUploadState('a')).toBe('pending');
    server.restore();
    await uploadPending();
    expect(await engine.getAttachmentUploadState('a')).toBe('uploaded');
  });

  it('keeps a file queued while the session is rejected', async () => {
    await added('a');
    server.fail('upload', ATTACHMENTS_BUCKET, 'JWT expired', 401);
    await expect(uploadPending()).rejects.toThrow();
    expect(await engine.getAttachmentUploadState('a')).toBe('pending');
  });
});

describe('fetchAttachmentFile', () => {
  it('downloads once and serves the local copy from then on', async () => {
    server.seedObjects(ATTACHMENTS_BUCKET, [{ name: 'a', data: bytes('abc'), created_at: T0 }]);
    expect(await fetchAttachmentFile('a')).toEqual(bytes('abc'));
    expect(await engine.getAttachmentUploadState('a')).toBe('uploaded');
    online = false;
    expect(await fetchAttachmentFile('a')).toEqual(bytes('abc'));
    expect(server.calls.filter((c) => c.op === 'download')).toHaveLength(1);
  });

  it('is null for a file the bucket does not have yet, or with no connection', async () => {
    expect(await fetchAttachmentFile('a')).toBeNull();
    online = false;
    expect(await fetchAttachmentFile('b')).toBeNull();
    expect(server.calls.filter((c) => c.op === 'download')).toHaveLength(1);
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
    await syncAttachmentFiles();
    expect(server.objects(ATTACHMENTS_BUCKET).map((o) => o.name)).toEqual([
      'young-orphan',
      'old-kept',
    ]);
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
    expect(await engine.getAttachmentUploadState('a')).toBe('uploaded');
  });

  it('a failure in the file work is logged and leaves the queue for next time', async () => {
    const stop = afterSync(syncAttachmentFiles);
    try {
      await added('a');
      server.fail('upload', ATTACHMENTS_BUCKET, 'network down');
      await syncAll();
      expect(warn).toHaveBeenCalled();
      expect(await engine.getAttachmentUploadState('a')).toBe('pending');
      server.restore();
      await syncAll();
      expect(await engine.getAttachmentUploadState('a')).toBe('uploaded');
    } finally {
      stop();
    }
  });
});
