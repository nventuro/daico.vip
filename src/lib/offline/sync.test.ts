import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Chore } from '../../types';
import { ALL_SPECS, CHORES_SPEC, SHOPPING_SPEC } from './specs';
import { localDb } from './testing/sqlocalInMemory';
import { server } from './testing/fakeSupabase';
import * as engine from './engine';
import { afterSync, getSyncStatus, resetSyncStatus, subscribeSyncStatus, syncAll } from './sync';

vi.mock('sqlocal', () => import('./testing/sqlocalInMemory'));
vi.mock('../supabase', () => import('./testing/fakeSupabase'));

// Node's navigator has no `onLine`; the sync engine bails out without it.
let online = true;
Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });

const T0 = '2026-08-27T10:00:00.000Z';
const T1 = '2026-08-27T10:00:01.000Z';
const T2 = '2026-08-27T10:00:02.000Z';

function at(iso: string): void {
  vi.setSystemTime(new Date(iso));
}

/** `Chore` as a plain record, the shape the fake server takes rows in. */
type ChoreRow = { [K in keyof Chore]: Chore[K] };

function serverChore(id: string, updatedAt: string, patch: Partial<Chore> = {}): ChoreRow {
  return {
    id,
    title: `Chore ${id}`,
    notes: null,
    done: false,
    due_on: null,
    created_at: T0,
    updated_at: updatedAt,
    ...patch,
  };
}

const newChore = { title: 'Regar', notes: null, done: false, due_on: null };

async function bookkeeping(table: string, id: string) {
  const rows = await localDb().sql<{ pending_op: string | null; synced: number }>(
    `SELECT pending_op, synced FROM ${table} WHERE id = ?`,
    id,
  );
  return rows[0] ?? null;
}

const callLog = () => server.calls.map((c) => `${c.op}:${c.table}`);

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  at(T0);
  online = true;
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
    online = false;
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
    await engine.update(CHORES_SPEC, 'a', { done: true });
    await engine.remove(CHORES_SPEC, 'b');
    await syncAll();

    expect(server.rows('chores')).toEqual([serverChore('a', T1, { done: true })]);
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
    await engine.update(CHORES_SPEC, 'a', { done: true });
    await engine.insert(CHORES_SPEC, newChore);
    await engine.remove(SHOPPING_SPEC, 's');
    await syncAll();

    expect(callLog()).toEqual([
      'select:household_key',
      'select:attachments',
      'upsert:chores',
      'upsert:chores',
      'select:chores',
      'delete:shopping_items',
      'select:shopping_items',
      ...ALL_SPECS.slice(4).map((spec) => `select:${spec.table}`),
    ]);
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
    const id = await engine.insert(SHOPPING_SPEC, { name: 'Pan', checked: false });
    await syncAll();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(server.rows('shopping_items')).toMatchObject([{ id }]);
    expect(callLog()).toEqual([
      'select:household_key',
      'select:attachments',
      'select:chores',
      'upsert:shopping_items',
      'select:shopping_items',
      ...ALL_SPECS.slice(4).map((spec) => `select:${spec.table}`),
    ]);
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
    online = false;
    pull.release();
    await Promise.all([first, second]);
    expect(callLog().filter((c) => c === 'select:chores')).toHaveLength(1);
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
