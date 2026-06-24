// =============================================================================
// Declarative specs for the offline-synced tables. Each spec drives the generic
// engine (engine.ts) — local schema, CRUD, and sync — so adding another
// offline table is just another entry here, no new sync code.
//
// Every synced table is assumed to have the standard columns the engine manages
// itself: `id` (a client-generated UUID text), `created_at`, and `updated_at`
// (the last-write-wins key). `columns` below lists only the app-specific ones.
// =============================================================================

export interface ColumnSpec {
  name: string;
  /** SQLite column type + constraints, e.g. 'TEXT NOT NULL'. */
  ddl: string;
  /** Stored as 0/1 in SQLite but exposed to the app as a JS boolean. */
  boolean?: boolean;
}

export interface TableSpec {
  /** Table name — identical in local SQLite and in Postgres. */
  table: string;
  /** App-specific columns (everything except id/created_at/updated_at). */
  columns: ColumnSpec[];
  /** ORDER BY clause (SQL) for the visible list. */
  orderBy: string;
}

export const SHOPPING_SPEC: TableSpec = {
  table: 'shopping_items',
  columns: [
    { name: 'name', ddl: 'TEXT NOT NULL' },
    { name: 'checked', ddl: 'INTEGER NOT NULL DEFAULT 0', boolean: true },
  ],
  orderBy: 'checked ASC, created_at ASC',
};

export const CHORES_SPEC: TableSpec = {
  table: 'chores',
  columns: [
    { name: 'title', ddl: 'TEXT NOT NULL' },
    { name: 'notes', ddl: 'TEXT' },
    { name: 'done', ddl: 'INTEGER NOT NULL DEFAULT 0', boolean: true },
    // Due date as a yyyy-mm-dd string (date-only, no timezone).
    { name: 'due_on', ddl: 'TEXT' },
  ],
  orderBy: 'done ASC, due_on ASC NULLS LAST, created_at ASC',
};

/** Every offline-synced table, in sync order. */
export const ALL_SPECS: TableSpec[] = [CHORES_SPEC, SHOPPING_SPEC];
