import { describe, it, expect, vi } from 'vitest';
import { CHORES_SPEC, DATES_SPEC, SHOPPING_SPEC, type Chore } from './specs';
import { localDb, seedSql } from './testing/sqlocalInMemory';
import * as engine from './engine';

vi.mock('sqlocal', () => import('./testing/sqlocalInMemory'));

// Three tables as older clients left them, each with a row synced back then,
// seeded before the store opens its database.
seedSql.push(
  // `chores` before it gained `comments`, `due_on` and the four that came with
  // repetition — all of them columns SQLite can add to a table that exists.
  `CREATE TABLE chores (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    pending_op TEXT,
    synced INTEGER NOT NULL DEFAULT 0
  )`,
  `INSERT INTO chores (id, title, created_at, updated_at, pending_op, synced)
    VALUES ('old', 'Regar', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, 1)`,
  // `dates` before it gained `occurs_on`, which is NOT NULL with no default:
  // SQLite refuses to add it, so the table has to be made again.
  `CREATE TABLE dates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    pending_op TEXT,
    synced INTEGER NOT NULL DEFAULT 0
  )`,
  `INSERT INTO dates (id, title, created_at, updated_at, pending_op, synced)
    VALUES ('old', 'Dentista', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, 1)`,
  // ...and one this device deleted offline and has not pushed yet.
  `INSERT INTO dates (id, title, created_at, updated_at, pending_op, synced)
    VALUES ('gone', 'Vacuna', '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z', 'delete', 1)`,
  // `shopping_items` with a column the spec no longer has: left in place it
  // would refuse every insert that does not fill it.
  `CREATE TABLE shopping_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    checked INTEGER NOT NULL DEFAULT 0,
    position TEXT,
    quantity TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    pending_op TEXT,
    synced INTEGER NOT NULL DEFAULT 0
  )`,
  `INSERT INTO shopping_items
    (id, name, checked, position, quantity, created_at, updated_at, pending_op, synced)
    VALUES ('old', 'Pan', 0, 'a0', '1 kg', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, 1)`,
);

/** The table's columns, in the order they are declared. */
async function columnsOf(table: string): Promise<string[]> {
  const info = await localDb().sql<{ name: string }>(`PRAGMA table_info(${table})`);
  return info.map((column) => column.name);
}

/** Everything the table holds, whatever its shape. */
async function rowsOf(table: string): Promise<Record<string, unknown>[]> {
  return localDb().sql(`SELECT * FROM ${table}`);
}

describe('table migration', () => {
  it('adds the columns a spec gained since the table was created', async () => {
    const rows = await engine.listVisible<Chore>(CHORES_SPEC);
    expect(await columnsOf('chores')).toEqual([
      'id',
      'title',
      'created_at',
      'updated_at',
      'pending_op',
      'synced',
      'comments',
      'due_on',
      'last_done_on',
      'repeat_every',
      'repeat_unit',
      'repeat_from',
    ]);
    expect(rows).toEqual([
      {
        id: 'old',
        title: 'Regar',
        comments: null,
        due_on: null,
        last_done_on: null,
        repeat_every: null,
        repeat_unit: null,
        repeat_from: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('then takes rows using the added columns', async () => {
    const id = await engine.insert(CHORES_SPEC, {
      title: 'Podar',
      comments: 'fondo',
      due_on: '2026-09-01',
      last_done_on: null,
      repeat_every: 3,
      repeat_unit: 'month',
      repeat_from: 'done',
    });
    const rows = await engine.listVisible<Chore>(CHORES_SPEC);
    expect(rows.find((c) => c.id === id)).toMatchObject({
      comments: 'fondo',
      due_on: '2026-09-01',
      repeat_every: 3,
      repeat_unit: 'month',
      repeat_from: 'done',
    });
  });

  it('makes the table again when a column it gained cannot be added', async () => {
    await engine.listVisible(DATES_SPEC);
    expect(await columnsOf('dates')).toEqual([
      'id',
      'title',
      'occurs_on',
      'repeat_every',
      'repeat_unit',
      'notice_days',
      'comments',
      'created_at',
      'updated_at',
      'pending_op',
      'synced',
    ]);
    // Emptied: the row had no value for `occurs_on`, and the next sync brings
    // the table down whole.
    expect(await rowsOf('dates')).toEqual([]);
  });

  it('keeps a deletion queued on a table it had to make again', async () => {
    await engine.listVisible(DATES_SPEC);
    // Only the id is kept, which every shape of the table has; without it the
    // pull that fills the table again would bring the row back.
    expect(await engine.getPendingDeletes(DATES_SPEC)).toEqual(['gone']);
  });

  it('forgets that deletion once it has been pushed', async () => {
    await engine.markDeleted(DATES_SPEC, 'gone');
    expect(await engine.getPendingDeletes(DATES_SPEC)).toEqual([]);
  });

  it('makes the table again when it has a column the spec dropped', async () => {
    await engine.listVisible(SHOPPING_SPEC);
    expect(await columnsOf('shopping_items')).toEqual([
      'id',
      'name',
      'checked',
      'position',
      'created_at',
      'updated_at',
      'pending_op',
      'synced',
    ]);
    expect(await rowsOf('shopping_items')).toEqual([]);
  });
});
