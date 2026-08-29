import { describe, it, expect, vi, beforeAll } from 'vitest';
import { CHORES_SPEC, type Chore } from './specs';
import { localDb, seedSql } from './testing/sqlocalInMemory';
import * as engine from './engine';

vi.mock('sqlocal', () => import('./testing/sqlocalInMemory'));

// A local database created by an older client, before `chores` gained
// `notes`, `done` and `due_on`, with a row synced back then.
const OLD_SHAPE = `CREATE TABLE chores (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  pending_op TEXT,
  synced INTEGER NOT NULL DEFAULT 0
)`;
const OLD_ROW = `INSERT INTO chores (id, title, created_at, updated_at, pending_op, synced)
  VALUES ('old', 'Regar', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, 1)`;

describe('column migration', () => {
  beforeAll(() => {
    seedSql.push(OLD_SHAPE, OLD_ROW);
  });

  it('adds the columns a spec gained since the table was created', async () => {
    const rows = await engine.listVisible<Chore>(CHORES_SPEC);
    const info = await localDb().sql<{ name: string }>('PRAGMA table_info(chores)');
    expect(info.map((c) => c.name)).toEqual([
      'id',
      'title',
      'created_at',
      'updated_at',
      'pending_op',
      'synced',
      'notes',
      'done',
      'due_on',
    ]);
    expect(rows).toEqual([
      {
        id: 'old',
        title: 'Regar',
        notes: null,
        done: false,
        due_on: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('then takes rows using the added columns', async () => {
    const id = await engine.insert(CHORES_SPEC, {
      title: 'Podar',
      notes: 'fondo',
      done: true,
      due_on: '2026-09-01',
    });
    const rows = await engine.listVisible<Chore>(CHORES_SPEC);
    expect(rows.find((c) => c.id === id)).toMatchObject({
      notes: 'fondo',
      done: true,
      due_on: '2026-09-01',
    });
  });
});
