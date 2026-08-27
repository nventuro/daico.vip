// =============================================================================
// Declarative specs for the offline-synced tables. Each spec drives the generic
// engine (engine.ts) — local schema, CRUD, and sync — so adding another
// offline table is just another entry here, no new sync code.
//
// Every synced table is assumed to have the standard columns the engine manages
// itself: `id` (a client-generated UUID text), `created_at`, and `updated_at`
// (the last-write-wins key). `columns` below lists only the app-specific ones.
// =============================================================================
import { DATE_NOTICE_DAYS_DEFAULT } from '../../types';

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
    // Client-owned fractional-index key for manual drag ordering (see ordering.ts).
    { name: 'position', ddl: 'TEXT' },
  ],
  // A struck (bought) item keeps its place in the list, so the order ignores `checked`.
  orderBy: 'position ASC NULLS LAST, created_at ASC',
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

export const GUIDES_SPEC: TableSpec = {
  table: 'guides',
  columns: [
    { name: 'title', ddl: 'TEXT NOT NULL' },
    { name: 'description', ddl: 'TEXT' },
  ],
  orderBy: 'title COLLATE NOCASE ASC',
};

export const GUIDE_CHAPTERS_SPEC: TableSpec = {
  table: 'guide_chapters',
  columns: [
    { name: 'guide_id', ddl: 'TEXT NOT NULL' },
    { name: 'section_title', ddl: 'TEXT NOT NULL' },
    { name: 'section_position', ddl: 'INTEGER NOT NULL' },
    { name: 'position', ddl: 'INTEGER NOT NULL' },
    { name: 'title', ddl: 'TEXT NOT NULL' },
    { name: 'body', ddl: 'TEXT NOT NULL' },
  ],
  orderBy: 'guide_id ASC, section_position ASC, position ASC',
};

export const DATES_SPEC: TableSpec = {
  table: 'dates',
  columns: [
    { name: 'title', ddl: 'TEXT NOT NULL' },
    // yyyy-mm-dd, like chores.due_on.
    { name: 'occurs_on', ddl: 'TEXT NOT NULL' },
    { name: 'repeat', ddl: "TEXT NOT NULL DEFAULT 'none'" },
    { name: 'repeat_months', ddl: 'INTEGER' },
    { name: 'notice_days', ddl: `INTEGER NOT NULL DEFAULT ${DATE_NOTICE_DAYS_DEFAULT}` },
    { name: 'notes', ddl: 'TEXT' },
  ],
  orderBy: 'occurs_on ASC, title COLLATE NOCASE ASC',
};

export const RECIPES_SPEC: TableSpec = {
  table: 'recipes',
  columns: [
    { name: 'title', ddl: 'TEXT NOT NULL' },
    // Markdown in the app's dialect; empty until the recipe is written.
    { name: 'body', ddl: "TEXT NOT NULL DEFAULT ''" },
    { name: 'minutes', ddl: 'INTEGER' },
    { name: 'servings', ddl: 'INTEGER' },
  ],
  orderBy: 'title COLLATE NOCASE ASC',
};

/** Every offline-synced table, in sync order. */
export const ALL_SPECS: TableSpec[] = [
  CHORES_SPEC,
  SHOPPING_SPEC,
  GUIDES_SPEC,
  GUIDE_CHAPTERS_SPEC,
  DATES_SPEC,
  RECIPES_SPEC,
];
