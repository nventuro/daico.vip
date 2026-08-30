import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ALL_SPECS,
  CHORES_SPEC,
  SHOPPING_SPEC,
  columnNames,
  type Chore,
  type ShoppingItem,
} from './specs';
import { GUIDE_IMAGE_CACHE, LOCAL_SPECS } from './localTables';
import { localDb } from './testing/sqlocalInMemory';
import { T0, T1, T2, at } from './testing/clock';
import { bookkeeping, newChore, serverChore, type ChoreRow } from './testing/rows';
import * as engine from './engine';

vi.mock('sqlocal', () => import('./testing/sqlocalInMemory'));

/** A clean, synced local copy of `chore` (as if pulled from the server). */
async function pulled(chore: ChoreRow): Promise<void> {
  await engine.reconcile(CHORES_SPEC, [chore]);
}

/** A row of a local-only table, written the way its owner would. */
async function cacheImage(key: string, data: string): Promise<void> {
  await engine.localWrite(
    GUIDE_IMAGE_CACHE.table,
    `INSERT OR REPLACE INTO ${GUIDE_IMAGE_CACHE.table} (key, mime, data) VALUES (?, ?, ?)`,
    key,
    'image/png',
    data,
  );
}

function watch(table: string): { calls: number; stop: () => void } {
  const watcher = { calls: 0, stop: () => {} };
  watcher.stop = engine.subscribe(table, () => {
    watcher.calls += 1;
  });
  return watcher;
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  at(T0);
  await engine.clearAll();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('local schema', () => {
  it('gives every spec table the app columns plus the bookkeeping ones', async () => {
    for (const spec of ALL_SPECS) {
      const info = await localDb().sql<{ name: string }>(`PRAGMA table_info(${spec.table})`);
      expect(info.map((c) => c.name)).toEqual([
        'id',
        ...columnNames(spec),
        'created_at',
        'updated_at',
        'pending_op',
        'synced',
      ]);
    }
  });

  it('accepts every spec order clause', async () => {
    for (const spec of ALL_SPECS) {
      await expect(engine.listVisible(spec)).resolves.toEqual([]);
    }
  });
});

describe('insert', () => {
  it('stores the row with a client-generated uuid, timestamps and a queued upsert', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([
      { id, ...newChore, created_at: T0, updated_at: T0 },
    ]);
    expect(await bookkeeping('chores', id)).toEqual({ pending_op: 'upsert', synced: 0 });
  });

  it('maps booleans and missing values', async () => {
    const checked = await engine.insert(SHOPPING_SPEC, {
      name: 'Pan',
      checked: true,
      position: null,
    });
    const unchecked = await engine.insert(SHOPPING_SPEC, {
      name: 'Leche',
      checked: false,
      position: null,
    });
    const items = await engine.listVisible<ShoppingItem>(SHOPPING_SPEC);
    expect(items.find((i) => i.id === checked)).toMatchObject({ checked: true, position: null });
    expect(items.find((i) => i.id === unchecked)).toMatchObject({ checked: false, position: null });
  });

  it('notifies the table subscribers', async () => {
    const watcher = watch('chores');
    await engine.insert(CHORES_SPEC, newChore);
    watcher.stop();
    expect(watcher.calls).toBe(1);
  });
});

describe('listVisible', () => {
  it('keeps a struck shopping item in its place', async () => {
    const first = await engine.insert(SHOPPING_SPEC, {
      name: 'Pan',
      checked: false,
      position: 'a0',
    });
    const second = await engine.insert(SHOPPING_SPEC, {
      name: 'Leche',
      checked: false,
      position: 'a1',
    });
    const third = await engine.insert(SHOPPING_SPEC, {
      name: 'Yerba',
      checked: false,
      position: 'a2',
    });
    await engine.update(SHOPPING_SPEC, second, { checked: true });
    const ids = (await engine.listVisible<ShoppingItem>(SHOPPING_SPEC)).map((i) => i.id);
    expect(ids).toEqual([first, second, third]);
  });

  it('orders rows by the spec clause', async () => {
    const later = await engine.insert(CHORES_SPEC, { ...newChore, due_on: '2026-09-02' });
    const noDate = await engine.insert(CHORES_SPEC, newChore);
    const done = await engine.insert(CHORES_SPEC, {
      ...newChore,
      last_done_on: '2026-01-01',
      due_on: '2026-01-01',
    });
    const sooner = await engine.insert(CHORES_SPEC, { ...newChore, due_on: '2026-09-01' });
    const ids = (await engine.listVisible<Chore>(CHORES_SPEC)).map((c) => c.id);
    expect(ids).toEqual([sooner, later, noDate, done]);
  });

  it('breaks ties by creation time', async () => {
    const first = await engine.insert(CHORES_SPEC, newChore);
    at(T1);
    const second = await engine.insert(CHORES_SPEC, newChore);
    const ids = (await engine.listVisible<Chore>(CHORES_SPEC)).map((c) => c.id);
    expect(ids).toEqual([first, second]);
  });

  it('hides rows queued for deletion', async () => {
    await pulled(serverChore('a', T0));
    await engine.remove(CHORES_SPEC, 'a');
    expect(await engine.listVisible(CHORES_SPEC)).toEqual([]);
  });
});

describe('update', () => {
  it('patches the given columns and bumps updated_at', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    at(T1);
    await engine.update(CHORES_SPEC, id, { title: 'Regar plantas', due_on: '2026-09-01' });
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([
      {
        id,
        ...newChore,
        title: 'Regar plantas',
        due_on: '2026-09-01',
        created_at: T0,
        updated_at: T1,
      },
    ]);
  });

  it('ignores keys that are not spec columns', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    // A patch is typed, so these keys can only come from a plain object.
    const patch = { id: 'other', created_at: T2, bogus: 1, title: 'x' } as Partial<Chore>;
    await engine.update(CHORES_SPEC, id, patch);
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([
      { id, ...newChore, title: 'x', created_at: T0, updated_at: T0 },
    ]);
  });

  it('stores an undefined value as null', async () => {
    const id = await engine.insert(CHORES_SPEC, { ...newChore, comments: 'con manguera' });
    await engine.update(CHORES_SPEC, id, { comments: undefined });
    expect((await engine.listVisible<Chore>(CHORES_SPEC))[0].comments).toBeNull();
  });

  it('queues a clean synced row for upsert again', async () => {
    await pulled(serverChore('a', T0));
    expect(await bookkeeping('chores', 'a')).toEqual({ pending_op: null, synced: 1 });
    at(T1);
    await engine.update(CHORES_SPEC, 'a', { last_done_on: '2026-08-27' });
    expect(await bookkeeping('chores', 'a')).toEqual({ pending_op: 'upsert', synced: 1 });
    expect(await engine.getPendingUpserts<Chore>(CHORES_SPEC)).toEqual([
      serverChore('a', T1, { last_done_on: '2026-08-27' }),
    ]);
  });

  it('leaves a row queued for deletion alone', async () => {
    await pulled(serverChore('a', T0));
    at(T1);
    await engine.remove(CHORES_SPEC, 'a');
    at(T2);
    await engine.update(CHORES_SPEC, 'a', { title: 'x' });
    expect(await engine.getPendingDeletes(CHORES_SPEC)).toEqual(['a']);
    expect(await engine.getPendingUpserts(CHORES_SPEC)).toEqual([]);
    const [row] = await localDb().sql<Chore>('SELECT * FROM chores WHERE id = ?', 'a');
    expect(row).toMatchObject({ title: 'Chore a', updated_at: T1 });
  });

  it('notifies the table subscribers', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    const watcher = watch('chores');
    await engine.update(CHORES_SPEC, id, { title: 'x' });
    watcher.stop();
    expect(watcher.calls).toBe(1);
  });
});

describe('remove', () => {
  it('turns a synced row into a hidden tombstone queued for deletion', async () => {
    await pulled(serverChore('a', T0));
    at(T1);
    await engine.remove(CHORES_SPEC, 'a');
    expect(await engine.listVisible(CHORES_SPEC)).toEqual([]);
    expect(await engine.getPendingDeletes(CHORES_SPEC)).toEqual(['a']);
    expect(await bookkeeping('chores', 'a')).toEqual({ pending_op: 'delete', synced: 1 });
    const [row] = await localDb().sql<Chore>('SELECT * FROM chores WHERE id = ?', 'a');
    expect(row.updated_at).toBe(T1);
  });

  it('also leaves a tombstone for a row not yet marked synced, whose push may be in flight', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    await engine.remove(CHORES_SPEC, id);
    expect(await engine.listVisible(CHORES_SPEC)).toEqual([]);
    expect(await engine.getPendingUpserts(CHORES_SPEC)).toEqual([]);
    expect(await engine.getPendingDeletes(CHORES_SPEC)).toEqual([id]);
  });

  it('is a no-op for an unknown id', async () => {
    await engine.insert(CHORES_SPEC, newChore);
    await engine.remove(CHORES_SPEC, 'nope');
    expect(await engine.listVisible(CHORES_SPEC)).toHaveLength(1);
    expect(await engine.getPendingDeletes(CHORES_SPEC)).toEqual([]);
  });

  it('notifies the table subscribers', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    const watcher = watch('chores');
    await engine.remove(CHORES_SPEC, id);
    watcher.stop();
    expect(watcher.calls).toBe(1);
  });
});

describe('clearAll', () => {
  it('wipes every table, tombstones included, and the local-only ones', async () => {
    await engine.insert(CHORES_SPEC, newChore);
    await pulled(serverChore('a', T0));
    await engine.remove(CHORES_SPEC, 'a');
    await engine.insert(SHOPPING_SPEC, { name: 'Pan', checked: false, position: null });
    await cacheImage('img', 'AAAA');

    await engine.clearAll();

    for (const spec of ALL_SPECS) {
      expect(await localDb().sql(`SELECT id FROM ${spec.table}`)).toEqual([]);
    }
    for (const spec of LOCAL_SPECS) {
      expect(await localDb().sql(`SELECT * FROM ${spec.table}`)).toEqual([]);
    }
  });

  it('notifies every table', async () => {
    const watchers = [...ALL_SPECS, ...LOCAL_SPECS].map((spec) => watch(spec.table));
    await engine.clearAll();
    for (const watcher of watchers) {
      watcher.stop();
      expect(watcher.calls).toBe(1);
    }
  });
});

describe('subscribe', () => {
  it('calls every listener of the table, and no other table', async () => {
    const chores = [watch('chores'), watch('chores')];
    const shopping = watch('shopping_items');
    await engine.insert(CHORES_SPEC, newChore);
    for (const watcher of [...chores, shopping]) watcher.stop();
    expect(chores.map((w) => w.calls)).toEqual([1, 1]);
    expect(shopping.calls).toBe(0);
  });

  it('stops after unsubscribe', async () => {
    const watcher = watch('chores');
    watcher.stop();
    await engine.insert(CHORES_SPEC, newChore);
    expect(watcher.calls).toBe(0);
  });
});

describe('local-only tables', () => {
  const rows = () =>
    engine.localQuery<{ key: string; data: string }>(
      `SELECT key, data FROM ${GUIDE_IMAGE_CACHE.table}`,
    );

  it('reads back what was written, and nothing for a key never written', async () => {
    expect(await rows()).toEqual([]);
    await cacheImage('img', 'AAAA');
    expect(await rows()).toEqual([{ key: 'img', data: 'AAAA' }]);
  });

  it("tells the table's watchers about a write", async () => {
    const watcher = watch(GUIDE_IMAGE_CACHE.table);
    await cacheImage('img', 'AAAA');
    watcher.stop();
    expect(watcher.calls).toBe(1);
  });
});

describe('sync queues', () => {
  it('getPendingUpserts returns queued inserts and edits in server shape', async () => {
    const id = await engine.insert(CHORES_SPEC, { ...newChore, last_done_on: '2026-08-27' });
    await pulled(serverChore('clean', T0));
    await pulled(serverChore('edited', T0));
    at(T1);
    await engine.update(CHORES_SPEC, 'edited', { comments: 'n' });
    await pulled(serverChore('gone', T0));
    await engine.remove(CHORES_SPEC, 'gone');

    const pending = await engine.getPendingUpserts<Chore>(CHORES_SPEC);
    expect(pending).toHaveLength(2);
    expect(pending).toContainEqual({
      id,
      ...newChore,
      last_done_on: '2026-08-27',
      created_at: T0,
      updated_at: T0,
    });
    expect(pending).toContainEqual(serverChore('edited', T1, { comments: 'n' }));
    for (const row of pending) expect(Object.keys(row)).not.toContain('pending_op');
  });

  it('getPendingDeletes returns only tombstones', async () => {
    await engine.insert(CHORES_SPEC, newChore);
    await pulled(serverChore('a', T0));
    await pulled(serverChore('b', T0));
    await engine.remove(CHORES_SPEC, 'b');
    expect(await engine.getPendingDeletes(CHORES_SPEC)).toEqual(['b']);
  });

  it('markUpserted clears the queue and marks the row synced when nothing changed since the push', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    await engine.markUpserted(CHORES_SPEC, id, T0);
    expect(await bookkeeping('chores', id)).toEqual({ pending_op: null, synced: 1 });
    expect(await engine.getPendingUpserts(CHORES_SPEC)).toEqual([]);
  });

  it('markUpserted keeps a row queued when it was edited after the push started', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    at(T1);
    await engine.update(CHORES_SPEC, id, { title: 'newer' });
    await engine.markUpserted(CHORES_SPEC, id, T0);
    expect((await bookkeeping('chores', id))?.pending_op).toBe('upsert');
    expect(await engine.getPendingUpserts<Chore>(CHORES_SPEC)).toMatchObject([
      { id, title: 'newer' },
    ]);
  });

  it('markUpserted leaves tombstones alone', async () => {
    await pulled(serverChore('a', T0));
    at(T1);
    await engine.remove(CHORES_SPEC, 'a');
    await engine.markUpserted(CHORES_SPEC, 'a', T1);
    expect(await engine.getPendingDeletes(CHORES_SPEC)).toEqual(['a']);
  });

  it('markDeleted drops the tombstone and nothing else', async () => {
    await pulled(serverChore('a', T0));
    await pulled(serverChore('b', T0));
    await engine.remove(CHORES_SPEC, 'a');
    await engine.markDeleted(CHORES_SPEC, 'a');
    await engine.markDeleted(CHORES_SPEC, 'b');
    expect(await bookkeeping('chores', 'a')).toBeNull();
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toMatchObject([{ id: 'b' }]);
  });
});

describe('reconcile', () => {
  it('inserts unknown server rows as clean synced rows', async () => {
    await engine.reconcile(CHORES_SPEC, [
      serverChore('a', T0, { last_done_on: '2026-08-27', comments: 'n' }),
    ]);
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([
      serverChore('a', T0, { last_done_on: '2026-08-27', comments: 'n' }),
    ]);
    expect(await bookkeeping('chores', 'a')).toEqual({ pending_op: null, synced: 1 });
  });

  it('stores server columns that are missing as null', async () => {
    await engine.reconcile(CHORES_SPEC, [{ id: 'a', title: 't', created_at: T0, updated_at: T0 }]);
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([
      serverChore('a', T0, { title: 't' }),
    ]);
  });

  it('applies a newer server version over a clean local row', async () => {
    await pulled(serverChore('a', T0));
    await pulled(
      serverChore('a', T1, {
        title: 'edited elsewhere',
        last_done_on: '2026-08-27',
        created_at: T1,
      }),
    );
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([
      serverChore('a', T1, {
        title: 'edited elsewhere',
        last_done_on: '2026-08-27',
        created_at: T1,
      }),
    ]);
    expect(await bookkeeping('chores', 'a')).toEqual({ pending_op: null, synced: 1 });
  });

  it('keeps the local row when the server version is older or the same', async () => {
    await pulled(serverChore('a', T1));
    await pulled(serverChore('a', T0, { title: 'stale' }));
    await pulled(serverChore('a', T1, { title: 'same instant' }));
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([serverChore('a', T1)]);
  });

  it('compares timestamps by instant, whatever their format', async () => {
    await pulled(serverChore('a', T0));
    await pulled(serverChore('a', '2026-08-27T10:00:00.000+00:00', { title: 'same instant' }));
    expect((await engine.listVisible<Chore>(CHORES_SPEC))[0].title).toBe('Chore a');
    await pulled(serverChore('a', '2026-08-27T07:00:01.000-03:00', { title: 'one second later' }));
    expect((await engine.listVisible<Chore>(CHORES_SPEC))[0].title).toBe('one second later');
  });

  it('leaves a row with a queued upsert alone even when the server is newer', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    await pulled(serverChore(id, T2, { title: 'server' }));
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([
      { id, ...newChore, created_at: T0, updated_at: T0 },
    ]);
    expect(await bookkeeping('chores', id)).toEqual({ pending_op: 'upsert', synced: 0 });
  });

  it('leaves a tombstone alone even when the server is newer', async () => {
    await pulled(serverChore('a', T0));
    at(T1);
    await engine.remove(CHORES_SPEC, 'a');
    await pulled(serverChore('a', T2, { title: 'server' }));
    expect(await engine.listVisible(CHORES_SPEC)).toEqual([]);
    expect(await engine.getPendingDeletes(CHORES_SPEC)).toEqual(['a']);
  });

  it('removes clean synced rows the server no longer has', async () => {
    await engine.reconcile(CHORES_SPEC, [serverChore('a', T0), serverChore('b', T0)]);
    await engine.reconcile(CHORES_SPEC, [serverChore('b', T0)]);
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toEqual([serverChore('b', T0)]);
    expect(await bookkeeping('chores', 'a')).toBeNull();
  });

  it('keeps rows with queued changes the server does not have', async () => {
    const id = await engine.insert(CHORES_SPEC, newChore);
    await pulled(serverChore('gone', T0));
    await engine.remove(CHORES_SPEC, 'gone');
    await engine.reconcile(CHORES_SPEC, []);
    expect(await engine.listVisible<Chore>(CHORES_SPEC)).toMatchObject([{ id }]);
    expect(await engine.getPendingDeletes(CHORES_SPEC)).toEqual(['gone']);
  });

  it('only touches the given table', async () => {
    const item = await engine.insert(SHOPPING_SPEC, {
      name: 'Pan',
      checked: false,
      position: null,
    });
    await engine.markUpserted(SHOPPING_SPEC, item, T0);
    await engine.reconcile(CHORES_SPEC, []);
    expect(await engine.listVisible<ShoppingItem>(SHOPPING_SPEC)).toMatchObject([{ id: item }]);
  });

  it('notifies subscribers only when something changed', async () => {
    const watcher = watch('chores');
    await engine.reconcile(CHORES_SPEC, [serverChore('a', T0)]);
    await engine.reconcile(CHORES_SPEC, [serverChore('a', T0)]);
    await engine.reconcile(CHORES_SPEC, [serverChore('a', T1)]);
    await engine.reconcile(CHORES_SPEC, []);
    watcher.stop();
    expect(watcher.calls).toBe(3);
  });
});
