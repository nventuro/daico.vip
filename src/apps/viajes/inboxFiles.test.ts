import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as engine from '../../lib/offline/engine';
import { TRIP_INBOX_SPEC, type TripInboxItem } from '../../lib/offline/specs';
import { server } from '../../lib/offline/testing/fakeSupabase';
import { T0, at, network } from '../../lib/offline/testing/clock';
import { toBase64 } from '../../lib/householdKey';
import {
  INBOX_FILE_ORPHAN_MIN_AGE_MS,
  deleteInboxFiles,
  heldInboxFiles,
  inboxFileIds,
  readInboxFiles,
  syncInboxFiles,
} from './inboxFiles';

vi.mock('sqlocal', () => import('../../lib/offline/testing/sqlocalInMemory'));
vi.mock('../../lib/supabase', () => import('../../lib/offline/testing/fakeSupabase'));

const FILES = 'trip_inbox_files';
const bytes = (text: string) => new TextEncoder().encode(text);
const OLD = new Date(Date.parse(T0) - 2 * INBOX_FILE_ORPHAN_MIN_AGE_MS).toISOString();

/** A staged row, listing `fileIds`. */
async function staged(id: string, importId: string, fileIds: string[]): Promise<void> {
  const row: Omit<TripInboxItem, 'id' | 'created_at' | 'updated_at'> = {
    import_id: importId,
    email_subject: 'Fwd: Tu vuelo',
    trip_title: 'Bariloche',
    kind: 'ticket',
    title: 'AR 1420',
    on_date: null,
    at_time: null,
    ends_on: null,
    ends_at: null,
    from_code: null,
    to_code: null,
    comments: null,
    file_ids: JSON.stringify(fileIds),
  };
  await engine.insert(TRIP_INBOX_SPEC, row, id);
}

/** A sealed file on the server, as the worker leaves it. */
function serverFile(id: string, importId: string, createdAt = T0) {
  return {
    id,
    import_id: importId,
    name: id,
    size: 3,
    data: toBase64(bytes(`pdf ${id}`)),
    wrapped_key: `wrapped ${id}`,
    created_at: createdAt,
  };
}

const serverIds = () => server.rows(FILES).map((row) => row.id);

/** A run in which the staged rows came down, as a healthy one does. */
const pulled = new Set([TRIP_INBOX_SPEC.table]);

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  at(T0);
  network.online = true;
  server.reset();
  await engine.clearAll();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('inboxFileIds', () => {
  it('reads the list a row carries', () => {
    expect(inboxFileIds({ file_ids: '[]' })).toEqual([]);
    expect(inboxFileIds({ file_ids: '["f1", "f2"]' })).toEqual(['f1', 'f2']);
  });
});

describe('syncInboxFiles', () => {
  it('fetches and keeps every file the staged rows list, once', async () => {
    server.seed(FILES, [serverFile('f1', 'e1'), serverFile('f2', 'e1'), serverFile('f3', 'e2')]);
    await staged('s1', 'e1', ['f1']);
    await staged('s2', 'e1', ['f1', 'f2']);
    await syncInboxFiles(pulled);
    expect(await heldInboxFiles(['f1', 'f2', 'f3'])).toEqual(new Set(['f1', 'f2']));
    const [f1] = await readInboxFiles(['f1']);
    expect(f1.data).toEqual(bytes('pdf f1'));
    expect(f1.wrapped_key).toBe('wrapped f1');
    // Gone from the server, still here: nothing was fetched again or dropped.
    server.reset();
    await syncInboxFiles(pulled);
    expect(await heldInboxFiles(['f1', 'f2'])).toEqual(new Set(['f1', 'f2']));
  });

  it('drops the copies no staged row lists any more', async () => {
    server.seed(FILES, [serverFile('f1', 'e1')]);
    await staged('s1', 'e1', ['f1']);
    await syncInboxFiles(pulled);
    await engine.remove(TRIP_INBOX_SPEC, 's1');
    await syncInboxFiles(pulled);
    expect(await heldInboxFiles(['f1'])).toEqual(new Set());
  });

  it('leaves a file the server does not have for a later run', async () => {
    await staged('s1', 'e1', ['f1']);
    await syncInboxFiles(pulled);
    expect(await heldInboxFiles(['f1'])).toEqual(new Set());
    server.seed(FILES, [serverFile('f1', 'e1')]);
    await syncInboxFiles(pulled);
    expect(await heldInboxFiles(['f1'])).toEqual(new Set(['f1']));
  });

  it('throws when the fetch fails, and the next run gets the file', async () => {
    server.seed(FILES, [serverFile('f1', 'e1')]);
    await staged('s1', 'e1', ['f1']);
    server.fail('select', FILES, 'network down');
    await expect(syncInboxFiles(pulled)).rejects.toThrow('network down');
    expect(await heldInboxFiles(['f1'])).toEqual(new Set());
    server.restore();
    await syncInboxFiles(pulled);
    expect(await heldInboxFiles(['f1'])).toEqual(new Set(['f1']));
  });

  it('sweeps from the server only a file past the grace whose rows are gone, and only when the rows came down', async () => {
    server.seed(FILES, [
      serverFile('old-orphan', 'gone', OLD),
      serverFile('young-orphan', 'gone'),
      serverFile('old-listed', 'e1', OLD),
    ]);
    await staged('s1', 'e1', ['old-listed']);
    await syncInboxFiles(new Set(['chores']));
    expect(serverIds().sort()).toEqual(['old-listed', 'old-orphan', 'young-orphan']);
    await syncInboxFiles(pulled);
    expect(serverIds().sort()).toEqual(['old-listed', 'young-orphan']);
  });
});

describe('readInboxFiles', () => {
  it('reads the copies here and fetches the rest, keeping them, in the order asked', async () => {
    server.seed(FILES, [serverFile('f1', 'e1'), serverFile('f2', 'e1')]);
    await staged('s1', 'e1', ['f1']);
    await syncInboxFiles(pulled);
    const files = await readInboxFiles(['f2', 'f1']);
    expect(files.map((file) => file.id)).toEqual(['f2', 'f1']);
    expect(await heldInboxFiles(['f2'])).toEqual(new Set(['f2']));
  });

  it('refuses with no connection to fetch what is missing, and when the server no longer has it', async () => {
    network.online = false;
    await expect(readInboxFiles(['f1'])).rejects.toThrow('todavía no llegaron');
    network.online = true;
    await expect(readInboxFiles(['f1'])).rejects.toThrow('ya no está');
  });
});

describe('deleteInboxFiles', () => {
  it('lets go of the copies here and on the server; with no connection, only here', async () => {
    server.seed(FILES, [serverFile('f1', 'e1'), serverFile('f2', 'e1')]);
    await staged('s1', 'e1', ['f1', 'f2']);
    await syncInboxFiles(pulled);
    await deleteInboxFiles(['f1']);
    expect(await heldInboxFiles(['f1', 'f2'])).toEqual(new Set(['f2']));
    expect(serverIds()).toEqual(['f2']);
    network.online = false;
    await deleteInboxFiles(['f2']);
    expect(await heldInboxFiles(['f2'])).toEqual(new Set());
    expect(serverIds()).toEqual(['f2']);
  });
});
