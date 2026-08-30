import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SYNC_FRESH_MS, SYNC_PULL_PAGE } from './sync';
import { ALL_SPECS, CHORES_SPEC, SHOPPING_SPEC, type Chore } from './specs';
import { server } from './testing/fakeSupabase';
import { T0, T1, T2, at, network } from './testing/clock';
import { bookkeeping, newChore, serverChore } from './testing/rows';
import * as engine from './engine';
import {
  afterSync,
  getSyncStatus,
  listRefusals,
  resetSyncStatus,
  subscribeSyncStatus,
  syncAll,
  syncIfStale,
} from './sync';

vi.mock('sqlocal', () => import('./testing/sqlocalInMemory'));
vi.mock('../supabase', () => import('./testing/fakeSupabase'));

const callLog = () => server.calls.map((c) => `${c.op}:${c.table}`);

/** The calls a whole run makes: every table pulled, in spec order, each one
 *  after whatever it had queued to push. */
function runCalls(pushes: Record<string, string[]>): string[] {
  return ALL_SPECS.flatMap((spec) => [...(pushes[spec.table] ?? []), `select:${spec.table}`]);
}

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  at(T0);
  network.online = true;
  server.reset();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  await engine.clearAll();
  resetSyncStatus();
});

afterEach(() => {
  warn.mockRestore();
  vi.useRealTimers();
});

describe('syncAll', () => {
  it('does nothing while offline', async () => {
    network.online = false;
    const id = await engine.insert(CHORES_SPEC, newChore);
    await syncAll();
    expect(server.calls).toEqual([]);
    expect(await bookkeeping('chores', id)).toEqual({ pending_op: 'upsert', synced: 0 });
  });

  it('pushes a queued insert in server shape and marks it synced', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    await syncAll();
    expect(server.rows('chores')).toEqual([{ id, ...newChore, created_at: T0, updated_at: T0 }]);
    expect(await bookkeeping('chores', id)).toEqual({ pending_op: null, synced: 1 });
    expect(await engine.getPendingUpserts(CHORES_SPEC)).toEqual([]);
  });

  it('pushes queued edits and deletes', async () => {
    server.seed('chores', [serverChore('a', T0), serverChore('b', T0)]);
    await syncAll();

    at(T1);
    await engine.update(CHORES_SPEC, 'a', { last_done_on: '2026-08-27' });
    await engine.remove(CHORES_SPEC, 'b');
    await syncAll();

    expect(server.rows('chores')).toEqual([serverChore('a', T1, { last_done_on: '2026-08-27' })]);
    expect(await bookkeeping('chores', 'a')).toEqual({ pending_op: null, synced: 1 });
    expect(await bookkeeping('chores', 'b')).toBeNull();
  });

  it('per table pushes upserts, then deletes, then pulls, in spec order', async () => {
    server.seed('chores', [serverChore('a', T0)]);
    server.seed('shopping_items', [
      { id: 's', name: 'Pan', checked: false, position: null, created_at: T0, updated_at: T0 },
    ]);
    await syncAll();
    server.calls.length = 0;

    at(T1);
    await engine.update(CHORES_SPEC, 'a', { last_done_on: '2026-08-27' });
    await engine.insert(CHORES_SPEC, newChore);
    await engine.remove(SHOPPING_SPEC, 's');
    await syncAll();

    expect(callLog()).toEqual(
      runCalls({
        chores: ['upsert:chores', 'upsert:chores'],
        shopping_items: ['delete:shopping_items'],
      }),
    );
  });

  it('pulls server rows, then applies edits and deletes made elsewhere', async () => {
    server.seed('chores', [serverChore('a', T0), serverChore('b', T0)]);
    await syncAll();
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([
      serverChore('a', T0),
      serverChore('b', T0),
    ]);

    server.reset();
    server.seed('chores', [
      serverChore('a', T1, { title: 'edited elsewhere' }),
      serverChore('c', T1),
    ]);
    await syncAll();
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([
      serverChore('a', T1, { title: 'edited elsewhere' }),
      serverChore('c', T1),
    ]);
  });

  it('takes a table whose rows carry a column this build does not know', async () => {
    // A database migrated ahead of the build running here. The pull asks for
    // the whole row rather than the columns this spec names, so the table
    // still comes down; what the spec does not declare is dropped.
    server.seed('chores', [{ ...serverChore('a', T0), colour: 'verde' }]);
    await syncAll();
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([serverChore('a', T0)]);
    expect(await bookkeeping('chores', 'a')).toEqual({ pending_op: null, synced: 1 });
  });

  it('keeps a row added during the pull and pushes it next time', async () => {
    const pull = server.hold('select', 'chores');
    const run = syncAll();
    await pull.started;
    const id = await engine.insert(CHORES_SPEC, newChore);
    pull.release();
    await run;

    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toMatchObject([{ id }]);
    expect(server.rows('chores')).toEqual([]);
    await syncAll();
    expect(server.rows('chores')).toMatchObject([{ id }]);
  });

  it('never throws: a failed push keeps the change queued for the next attempt', async () => {
    server.fail('upsert', 'chores');
    const id = await engine.insert(CHORES_SPEC, newChore);
    await expect(syncAll()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(server.rows('chores')).toEqual([]);
    expect(await bookkeeping('chores', id)).toEqual({ pending_op: 'upsert', synced: 0 });

    server.reset();
    await syncAll();
    expect(server.rows('chores')).toMatchObject([{ id }]);
    expect(await bookkeeping('chores', id)).toEqual({ pending_op: null, synced: 1 });
  });

  it('skips a row the server refuses for good and gets the rest of the table through', async () => {
    const refused = await engine.insert(CHORES_SPEC, newChore);
    const rest = await engine.insert(CHORES_SPEC, { ...newChore, title: 'Barrer' });
    server.fail('upsert', 'chores', 'violates check constraint "chores_title_check"', {
      code: '23514',
      id: refused,
    });
    await syncAll();

    expect(server.rows('chores').map((r) => r.id)).toEqual([rest]);
    expect(await bookkeeping('chores', rest)).toEqual({ pending_op: null, synced: 1 });
    // Still queued: another version of it may yet be one the server takes.
    expect(await bookkeeping('chores', refused)).toEqual({ pending_op: 'upsert', synced: 0 });
    expect(callLog()).toContain('select:chores');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('writes down what the server refused for good, and forgets it once it goes through', async () => {
    const refused = await engine.insert(CHORES_SPEC, newChore);
    server.fail('upsert', 'chores', 'violates check constraint "chores_title_check"', {
      code: '23514',
      id: refused,
    });
    await syncAll();

    // The code and nothing else: a refusal comes back quoting the private row.
    expect(await listRefusals()).toEqual([{ table: 'chores', id: refused, code: '23514', at: T0 }]);

    server.reset();
    await syncAll();
    expect(await listRefusals()).toEqual([]);
  });

  it('pulls a table of more rows than one page whole, and keeps them', async () => {
    const count = SYNC_PULL_PAGE + 3;
    server.seed(
      'chores',
      Array.from({ length: count }, (_, i) => serverChore(String(i).padStart(5, '0'), T0)),
    );
    await syncAll();
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toHaveLength(count);
    expect(callLog().filter((c) => c === 'select:chores')).toHaveLength(2);

    // The rows past the first page must not read as deleted elsewhere.
    await syncAll();
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toHaveLength(count);
  });

  it('tells the after-sync work which tables came down', async () => {
    server.fail('select', 'chores');
    let seen: ReadonlySet<string> | null = null;
    const stop = afterSync(async (synced) => {
      seen = new Set(synced);
    });
    try {
      await syncAll();
    } finally {
      stop();
    }
    expect(seen).not.toBeNull();
    expect([...(seen ?? [])]).not.toContain('chores');
    expect([...(seen ?? [])]).toContain('attachments');
  });

  it('a failed pull leaves local data untouched', async () => {
    server.seed('chores', [serverChore('a', T0)]);
    await syncAll();
    server.reset();
    server.fail('select', 'chores');
    await syncAll();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([serverChore('a', T0)]);
  });

  it('a failing table does not stop the others from syncing', async () => {
    server.fail('select', 'chores');
    const id = await engine.insert(SHOPPING_SPEC, { name: 'Pan', checked: false, position: null });
    await syncAll();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(server.rows('shopping_items')).toMatchObject([{ id }]);
    expect(callLog()).toEqual(runCalls({ shopping_items: ['upsert:shopping_items'] }));
  });

  it('coalesces overlapping calls into one extra run that picks up later changes', async () => {
    const pull = server.hold('select', 'chores');
    const first = syncAll();
    await pull.started;
    const id = await engine.insert(CHORES_SPEC, newChore);
    const second = syncAll();
    const third = syncAll();
    pull.release();
    await Promise.all([first, second, third]);

    expect(server.rows('chores')).toMatchObject([{ id }]);
    expect(callLog().filter((c) => c === 'select:chores')).toHaveLength(2);
  });

  it('does not rerun after going offline mid-sync', async () => {
    const pull = server.hold('select', 'chores');
    const first = syncAll();
    await pull.started;
    const second = syncAll();
    network.online = false;
    pull.release();
    await Promise.all([first, second]);
    expect(callLog().filter((c) => c === 'select:chores')).toHaveLength(1);
  });
});

describe('what the server settles', () => {
  it('cannot push an edit older than the one the server already took', async () => {
    server.seed('chores', [serverChore('a', T0)]);
    await syncAll();

    // Edited here at T1, and elsewhere at T2 — but this device is the one
    // that gets to push, a moment too late.
    at(T1);
    await engine.update<Chore>(CHORES_SPEC, 'a', { title: 'edited here' });
    server.seed('chores', [serverChore('a', T2, { title: 'edited elsewhere' })]);
    at(T2);
    await syncAll();

    // The later edit stands on the server and comes back down over the older
    // one: both devices end up reading the same row.
    expect(server.rows('chores')).toEqual([serverChore('a', T2, { title: 'edited elsewhere' })]);
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([
      serverChore('a', T2, { title: 'edited elsewhere' }),
    ]);
    expect(await bookkeeping('chores', 'a')).toEqual({ pending_op: null, synced: 1 });
  });

  it('pushes an edit newer than the stored row, and it stands', async () => {
    server.seed('chores', [serverChore('a', T0)]);
    await syncAll();
    at(T1);
    await engine.update<Chore>(CHORES_SPEC, 'a', { title: 'edited here' });
    await syncAll();
    expect(server.rows('chores')).toMatchObject([{ title: 'edited here', updated_at: T1 }]);
  });

  it('keeps a queued write the server will not take from a session that is not a member', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    await syncAll();

    // The account is signed in but no longer on the allowlist: it reads
    // nothing and writes nothing, whatever the gate on the device believes.
    server.member = false;
    at(T1);
    await engine.update<Chore>(CHORES_SPEC, id, { title: 'edited while out' });
    await syncAll();

    // The edit did not reach the server, and the pull that came back empty
    // did not take the row for one deleted elsewhere.
    expect(server.rows('chores')).toMatchObject([{ title: 'Regar' }]);
    expect(await bookkeeping('chores', id)).toEqual({ pending_op: 'upsert', synced: 1 });
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toMatchObject([
      { id, title: 'edited while out' },
    ]);

    // Back on the allowlist, what stayed queued goes out.
    server.member = true;
    await syncAll();
    expect(server.rows('chores')).toMatchObject([{ id, title: 'edited while out' }]);
  });
});

describe('changes made while a push is in flight', () => {
  it('a row deleted while its insert is being pushed stays deleted everywhere', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    const push = server.hold('upsert', 'chores');
    const run = syncAll();
    await push.started;
    at(T1);
    await engine.remove(CHORES_SPEC, id);
    push.release();
    await run;

    expect(await engine.listVisible(CHORES_SPEC)).toEqual([]);
    expect(server.rows('chores')).toEqual([]);
    await syncAll();
    expect(await engine.listVisible(CHORES_SPEC)).toEqual([]);
    expect(await bookkeeping('chores', id)).toBeNull();
  });

  it('an edit made while its row is being pushed goes out with the next sync', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    const push = server.hold('upsert', 'chores');
    const run = syncAll();
    await push.started;
    at(T1);
    await engine.update(CHORES_SPEC, id, { title: 'newer' });
    push.release();
    await run;

    expect(server.rows('chores')).toMatchObject([{ id, title: 'Regar', updated_at: T0 }]);
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toMatchObject([
      { id, title: 'newer', updated_at: T1 },
    ]);
    expect(await engine.getPendingUpserts<Chore>(CHORES_SPEC)).toMatchObject([
      { id, title: 'newer' },
    ]);

    await syncAll();
    expect(server.rows('chores')).toMatchObject([{ id, title: 'newer', updated_at: T1 }]);
    expect(await bookkeeping('chores', id)).toEqual({ pending_op: null, synced: 1 });
  });

  it('a row deleted after an edit raced its push stays deleted everywhere', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    const push = server.hold('upsert', 'chores');
    const run = syncAll();
    await push.started;
    at(T1);
    await engine.update(CHORES_SPEC, id, { title: 'newer' });
    push.release();
    await run;

    at(T2);
    await engine.remove(CHORES_SPEC, id);
    await syncAll();
    expect(await engine.listVisible(CHORES_SPEC)).toEqual([]);
    expect(server.rows('chores')).toEqual([]);
    expect(await bookkeeping('chores', id)).toBeNull();
  });
});

describe('sync status', () => {
  it('reports each table in turn and stamps the run once everything went through', async () => {
    expect(getSyncStatus()).toMatchObject({ syncing: false, completedAt: null });
    const seen: string[] = [];
    const stop = subscribeSyncStatus(() => {
      const { syncing, tables } = getSyncStatus();
      const pulling = Object.entries(tables).find(([, state]) => state === 'pulling')?.[0];
      seen.push(`${syncing ? 'on' : 'off'}:${pulling ?? '-'}`);
    });
    await syncAll();
    stop();

    expect(seen[0]).toBe('on:-');
    expect(seen.at(-1)).toBe('off:-');
    // Each table is the one being pulled, in spec order, and never two at once.
    const pulled = seen.filter((s) => s !== 'on:-' && s !== 'off:-').map((s) => s.slice(3));
    expect(pulled).toEqual(ALL_SPECS.map((spec) => spec.table));
    expect(Object.values(getSyncStatus().tables)).toEqual(ALL_SPECS.map(() => 'done'));
    expect(getSyncStatus()).toMatchObject({ syncing: false, completedAt: T0 });
  });

  it('leaves the run unstamped when a table or the after-sync work fails', async () => {
    server.fail('select', 'chores');
    await syncAll();
    expect(getSyncStatus().completedAt).toBeNull();
    expect(getSyncStatus().tables.chores).toBe('pending');
    expect(getSyncStatus().tables.shopping_items).toBe('done');

    server.restore();
    const off = afterSync(async () => {
      throw new Error('bucket down');
    });
    await syncAll();
    off();
    expect(getSyncStatus().completedAt).toBeNull();

    at(T1);
    await syncAll();
    expect(getSyncStatus().completedAt).toBe(T1);
  });

  it('forgets the stamp when reset', async () => {
    await syncAll();
    expect(getSyncStatus().completedAt).toBe(T0);
    resetSyncStatus();
    expect(getSyncStatus()).toMatchObject({ completedAt: null, tables: {}, files: null });
  });
});

describe('syncIfStale', () => {
  it('runs once, then not again until the last run is old enough', async () => {
    await syncIfStale();
    const runCalls = server.calls.length;
    expect(runCalls).toBeGreaterThan(0);

    at(new Date(new Date(T0).getTime() + SYNC_FRESH_MS - 1).toISOString());
    await syncIfStale();
    expect(server.calls.length).toBe(runCalls);

    at(new Date(new Date(T0).getTime() + SYNC_FRESH_MS).toISOString());
    await syncIfStale();
    expect(server.calls.length).toBe(runCalls * 2);
  });

  it('does not queue a rerun while a run is going on', async () => {
    const { started, release } = server.hold('select', 'chores');
    const first = syncAll();
    await started;
    const second = syncIfStale();
    release();
    await Promise.all([first, second]);
    expect(callLog().filter((c) => c === 'select:chores')).toHaveLength(1);
  });
});
