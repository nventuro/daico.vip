// =============================================================================
// The rows a store test works with, and the bookkeeping the engine keeps
// beside them.
// =============================================================================
import type { Chore } from '../specs';
import { localDb } from './sqlocalInMemory';
import { T0 } from './clock';

/** `Chore` as a plain record, the shape rows cross the wire in. */
export type ChoreRow = { [K in keyof Chore]: Chore[K] };

/** A row as the server would send it, with every column present. */
export function serverChore(
  id: string,
  updatedAt: string,
  patch: Partial<Omit<Chore, 'id' | 'updated_at'>> = {},
): ChoreRow {
  return {
    id,
    title: `Chore ${id}`,
    notes: null,
    due_on: null,
    last_done_on: null,
    repeat_every: null,
    repeat_unit: null,
    repeat_from: null,
    created_at: T0,
    updated_at: updatedAt,
    ...patch,
  };
}

/** A chore as the app hands one to the store to create. */
export const newChore = {
  title: 'Regar',
  notes: null,
  due_on: null,
  last_done_on: null,
  repeat_every: null,
  repeat_unit: null,
  repeat_from: null,
};

type Bookkeeping = { pending_op: string | null; synced: number };

/** The local-only sync columns of a row, or null when the row is gone. */
export async function bookkeeping(table: string, id: string): Promise<Bookkeeping | null> {
  const rows = await localDb().sql<Bookkeeping>(
    `SELECT pending_op, synced FROM ${table} WHERE id = ?`,
    id,
  );
  return rows[0] ?? null;
}
