// =============================================================================
// The offline-synced tables, one place each: the row as the app sees it, the
// values its enumerated columns may take, and the spec that drives the generic
// engine — local schema, CRUD, and sync. Adding another offline
// table is another entry here, no new sync code.
//
// Every row carries the standard columns the engine manages itself (SyncedRow:
// `id`, `created_at`, `updated_at`); `columns` declares exactly the rest, so a
// column missing from either the row type or the spec fails to compile.
// =============================================================================
import type { AttachmentOwnerKind, SyncedRow } from '../../types';
import type { RepeatUnit } from '../../utils/recurrence';

/** How a column is declared in SQLite, and how its values cross to the app. */
export interface ColumnSpec {
  /** SQLite column type + constraints, e.g. 'TEXT NOT NULL'. */
  ddl: string;
  /** Stored as 0/1 in SQLite but exposed to the app as a JS boolean. */
  boolean?: boolean;
}

/** A table's own columns, in the order they are declared in SQL (an object
 *  keeps its keys in insertion order). */
export type ColumnSpecs<Row extends SyncedRow> = Record<
  Exclude<keyof Row, keyof SyncedRow>,
  ColumnSpec
>;

export interface TableSpec<Row extends SyncedRow = SyncedRow> {
  /** Table name — identical in local SQLite and in Postgres. */
  table: string;
  /** Everything except the columns the engine manages. */
  columns: ColumnSpecs<Row>;
  /** ORDER BY clause (SQL) for the visible list. */
  orderBy: string;
}

/** What a row is made of, minus what the engine fills in: the values a caller
 *  gives when it creates one. */
export type RowInput<Row extends SyncedRow> = Omit<Row, keyof SyncedRow>;

/** A spec's own columns as name/spec pairs, in DDL order. */
export function columnsOf(spec: TableSpec): [string, ColumnSpec][] {
  return Object.entries(spec.columns as Record<string, ColumnSpec>);
}

/** A spec's own column names, in DDL order. */
export function columnNames(spec: TableSpec): string[] {
  return Object.keys(spec.columns as Record<string, ColumnSpec>);
}

// ─── The shell's tables, and the ones several apps share ─────────────────────

/**
 * The household's master key, wrapped under a key derived from the phrase the
 * members hold on paper, with the derivation parameters. One row per
 * household; synced so a device can unlock offline once it has pulled it.
 */
export interface HouseholdKey extends SyncedRow {
  kdf: 'pbkdf2-sha256';
  /** Base64. */
  salt: string;
  iterations: number;
  /** Base64: the AES-KW wrap of the master key. */
  wrapped_master_key: string;
}

export const HOUSEHOLD_KEY_SPEC: TableSpec<HouseholdKey> = {
  table: 'household_key',
  columns: {
    kdf: { ddl: 'TEXT NOT NULL' },
    salt: { ddl: 'TEXT NOT NULL' },
    iterations: { ddl: 'INTEGER NOT NULL' },
    wrapped_master_key: { ddl: 'TEXT NOT NULL' },
  },
  orderBy: 'created_at ASC',
};

/**
 * A picture attached to an entry. Only this metadata is a synced row; the
 * picture itself lives encrypted in the attachments bucket under the row's
 * id, and only ever changes by being replaced with a new attachment.
 */
export interface Attachment extends SyncedRow {
  owner_kind: AttachmentOwnerKind;
  owner_id: string;
  /** What the user called it; empty for an attachment left unnamed. */
  name: string;
  mime: string;
  /** Of the file itself, before encryption, in bytes. */
  size: number;
  /** Base64: the file's own key, wrapped under the household's master key. */
  wrapped_file_key: string;
}

export const ATTACHMENTS_SPEC: TableSpec<Attachment> = {
  table: 'attachments',
  columns: {
    owner_kind: { ddl: 'TEXT NOT NULL' },
    owner_id: { ddl: 'TEXT NOT NULL' },
    name: { ddl: "TEXT NOT NULL DEFAULT ''" },
    mime: { ddl: 'TEXT NOT NULL' },
    size: { ddl: 'INTEGER NOT NULL' },
    wrapped_file_key: { ddl: 'TEXT NOT NULL' },
  },
  orderBy: 'created_at ASC',
};

// ─── Tareas ──────────────────────────────────────────────────────────────────

/** What the next date of a repeating chore is counted from. */
export const REPEAT_FROMS = ['due', 'done'] as const;
export type RepeatFrom = (typeof REPEAT_FROMS)[number];

/**
 * A chore / task to be done. A chore that repeats is the same row coming back:
 * marking it writes the day it was marked and moves `due_on` on, so there is
 * never a second row for the next time and nothing is ever created on a
 * device's behalf. The three `repeat_*` columns are set and cleared together —
 * `repeat_every` being null is the whole of "this does not repeat".
 */
export interface Chore extends SyncedRow {
  title: string;
  /** Whatever else there is to say about the chore. */
  comments: string | null;
  /** When it is due (yyyy-mm-dd); for a chore that repeats, the day the next
   *  one falls on. Null for a chore with no date, which never repeats. */
  due_on: string | null;
  /** The day it was last marked (yyyy-mm-dd), null if it never was. A chore
   *  that does not repeat and carries one is done: that pair is what `done`
   *  used to be, plus when. */
  last_done_on: string | null;
  /** How many `repeat_unit`s go by between one and the next; null when the
   *  chore does not repeat. */
  repeat_every: number | null;
  repeat_unit: RepeatUnit | null;
  repeat_from: RepeatFrom | null;
}

export const CHORES_SPEC: TableSpec<Chore> = {
  table: 'chores',
  columns: {
    title: { ddl: 'TEXT NOT NULL' },
    comments: { ddl: 'TEXT' },
    // Dates as yyyy-mm-dd strings (date-only, no timezone).
    due_on: { ddl: 'TEXT' },
    last_done_on: { ddl: 'TEXT' },
    repeat_every: { ddl: 'INTEGER' },
    repeat_unit: { ddl: 'TEXT' },
    repeat_from: { ddl: 'TEXT' },
  },
  // Done last, then by date. A chore that repeats is never done, however long
  // ago it was marked, so it keeps its place among the dates.
  orderBy:
    '(last_done_on IS NOT NULL AND repeat_every IS NULL) ASC, due_on ASC NULLS LAST, created_at ASC',
};

// ─── Compras ─────────────────────────────────────────────────────────────────

/** An item on the shared shopping list. */
export interface ShoppingItem extends SyncedRow {
  name: string;
  checked: boolean;
  /**
   * Client-owned fractional-index sort key (base-62) for manual ordering.
   * Reordering writes only this column on the moved row. Null sorts last (e.g.
   * a row inserted manually via SQL); the client sets it on every insert.
   */
  position: string | null;
}

export const SHOPPING_SPEC: TableSpec<ShoppingItem> = {
  table: 'shopping_items',
  columns: {
    name: { ddl: 'TEXT NOT NULL' },
    checked: { ddl: 'INTEGER NOT NULL DEFAULT 0', boolean: true },
    position: { ddl: 'TEXT' },
  },
  // A struck (bought) item keeps its place in the list, so the order ignores `checked`.
  orderBy: 'position ASC NULLS LAST, created_at ASC',
};

// ─── Guías ───────────────────────────────────────────────────────────────────

/** An imported reference document. Read-only in the app — rows come from an
 *  import script — but offline-synced like every other table. */
export interface Guide extends SyncedRow {
  title: string;
  description: string | null;
}

export const GUIDES_SPEC: TableSpec<Guide> = {
  table: 'guides',
  columns: {
    title: { ddl: 'TEXT NOT NULL' },
    description: { ddl: 'TEXT' },
  },
  orderBy: 'title COLLATE NOCASE ASC',
};

/**
 * One readable page of a guide. Chapters are grouped into sections and ordered
 * by `section_position` then `position`. `body` is markdown (CommonMark plus
 * the app's directives for images, videos and spoilers); images are referenced
 * by key and fetched separately.
 */
export interface GuideChapter extends SyncedRow {
  guide_id: string;
  section_title: string;
  section_position: number;
  position: number;
  title: string;
  body: string;
}

export const GUIDE_CHAPTERS_SPEC: TableSpec<GuideChapter> = {
  table: 'guide_chapters',
  columns: {
    guide_id: { ddl: 'TEXT NOT NULL' },
    section_title: { ddl: 'TEXT NOT NULL' },
    section_position: { ddl: 'INTEGER NOT NULL' },
    position: { ddl: 'INTEGER NOT NULL' },
    title: { ddl: 'TEXT NOT NULL' },
    body: { ddl: 'TEXT NOT NULL' },
  },
  orderBy: 'guide_id ASC, section_position ASC, position ASC',
};

// ─── Fechas ──────────────────────────────────────────────────────────────────

/**
 * A calendar entry — a birthday, an appointment, a renewal. Not a task: nothing
 * is ever done, and the app never rewrites a row on its own. `occurs_on` is the
 * anchor the user entered; a recurring entry's next occurrence is computed from
 * it on read, so it rolls over by itself.
 */
export interface DateEntry extends SyncedRow {
  title: string;
  /** The anchor: the ISO date (yyyy-mm-dd) entered by the user, never moved by the app. */
  occurs_on: string;
  /** How many `repeat_unit`s go by between one occurrence and the next; null
   *  when the date happens once. The pair is the same one chores carry. */
  repeat_every: number | null;
  repeat_unit: RepeatUnit | null;
  /** How many days ahead the entry shows on the home screen (0 = only on the day). */
  notice_days: number;
  /** Whatever else there is to say about the date. */
  comments: string | null;
}

/** Notice window (days ahead) a new date gets unless the user picks another. */
export const DATE_NOTICE_DAYS_DEFAULT = 7;

export const DATES_SPEC: TableSpec<DateEntry> = {
  table: 'dates',
  columns: {
    title: { ddl: 'TEXT NOT NULL' },
    // yyyy-mm-dd: the day the entry falls on.
    occurs_on: { ddl: 'TEXT NOT NULL' },
    repeat_every: { ddl: 'INTEGER' },
    repeat_unit: { ddl: 'TEXT' },
    notice_days: { ddl: `INTEGER NOT NULL DEFAULT ${DATE_NOTICE_DAYS_DEFAULT}` },
    comments: { ddl: 'TEXT' },
  },
  orderBy: 'occurs_on ASC, title COLLATE NOCASE ASC',
};

// ─── Recetas ─────────────────────────────────────────────────────────────────

/** A recipe: a title and a markdown body in the app's dialect (an
 *  `:::ingredients` block renders as a tickable list). Created with only a
 *  title and written afterwards, so an empty body is normal. */
export interface Recipe extends SyncedRow {
  title: string;
  body: string;
  /** Total time in minutes, when known. */
  minutes: number | null;
  /** How many portions it yields, when known. */
  servings: number | null;
}

export const RECIPES_SPEC: TableSpec<Recipe> = {
  table: 'recipes',
  columns: {
    title: { ddl: 'TEXT NOT NULL' },
    // Markdown in the app's dialect; empty until the recipe is written.
    body: { ddl: "TEXT NOT NULL DEFAULT ''" },
    minutes: { ddl: 'INTEGER' },
    servings: { ddl: 'INTEGER' },
  },
  orderBy: 'title COLLATE NOCASE ASC',
};

// ─── Documentos ──────────────────────────────────────────────────────────────

/**
 * A document — a passport, an ID, a policy — whose content is its attachments:
 * the pictures of it. The row holds only what lists it and announces its
 * expiry; anything sensitive (a number, a date of birth) stays inside the
 * encrypted files.
 */
export interface DocumentEntry extends SyncedRow {
  title: string;
  /** When it stops being valid (yyyy-mm-dd), if it ever does. */
  expires_on: string | null;
  /** How many days ahead of its expiry the document shows on the home screen. */
  notice_days: number;
}

/** Notice window (days ahead of its expiry) a new document gets. */
export const DOCUMENT_NOTICE_DAYS_DEFAULT = 30;

export const DOCUMENTS_SPEC: TableSpec<DocumentEntry> = {
  table: 'documents',
  columns: {
    title: { ddl: 'TEXT NOT NULL' },
    // yyyy-mm-dd; null for a document that never expires.
    expires_on: { ddl: 'TEXT' },
    notice_days: { ddl: `INTEGER NOT NULL DEFAULT ${DOCUMENT_NOTICE_DAYS_DEFAULT}` },
  },
  orderBy: 'title COLLATE NOCASE ASC',
};

// ─── Gastos ──────────────────────────────────────────────────────────────────

/** The credit-card statement layouts the app can read. */
export const STATEMENT_FORMATS = ['galicia-visa', 'galicia-mastercard'] as const;
export type StatementFormat = (typeof STATEMENT_FORMATS)[number];

/** What a purchase is filed under. A fixed set: a merchant rule names one. */
export const SPENDING_CATEGORIES = [
  'salidas',
  'supermercado',
  'salud',
  'auto',
  'hogar',
  'suscripciones',
  'entretenimiento',
  'compras',
  'viajes',
  'mascotas',
  'transporte',
  'impuestos',
  'otros',
] as const;
export type SpendingCategory = (typeof SPENDING_CATEGORIES)[number];

/**
 * One credit-card statement, read on the device from the bank's PDF. The row
 * keeps in the clear only what lists it and announces its due date; the
 * statement itself — every purchase, the installments to come — is `payload`,
 * compressed and encrypted under a key of its own wrapped under the
 * household's master key, like an attachment's file.
 */
export interface Statement extends SyncedRow {
  format: StatementFormat;
  /** The day the bank closed it (yyyy-mm-dd). */
  closed_on: string;
  /** The day it is debited (yyyy-mm-dd). */
  due_on: string;
  total_ars_cents: number;
  total_usd_cents: number;
  /** Marked by a member once the card was paid; until then the statement is
   *  coming up, however far off its due date. */
  paid: boolean;
  /** Base64: the payload's own key, wrapped under the household's master key. */
  wrapped_key: string;
  /** Base64: the statement's contents, compressed then encrypted. */
  payload: string;
}

export const STATEMENTS_SPEC: TableSpec<Statement> = {
  table: 'statements',
  columns: {
    format: { ddl: 'TEXT NOT NULL' },
    // yyyy-mm-dd: the day the bank closed the period.
    closed_on: { ddl: 'TEXT NOT NULL' },
    due_on: { ddl: 'TEXT NOT NULL' },
    total_ars_cents: { ddl: 'INTEGER NOT NULL' },
    total_usd_cents: { ddl: 'INTEGER NOT NULL' },
    paid: { ddl: 'INTEGER NOT NULL DEFAULT 0', boolean: true },
    wrapped_key: { ddl: 'TEXT NOT NULL' },
    // Base64 of the encrypted contents: a few KB, small enough to travel with the row.
    payload: { ddl: 'TEXT NOT NULL' },
  },
  orderBy: 'closed_on DESC, format ASC',
};

/**
 * Files every purchase whose merchant contains `pattern` under `category`, in
 * every statement. The pattern names where the household shops, so it is
 * encrypted like a statement's contents; the category alone says nothing.
 */
export interface MerchantRule extends SyncedRow {
  /** Base64: the pattern's own key, wrapped under the household's master key. */
  wrapped_key: string;
  /** Base64: the pattern, encrypted. */
  pattern: string;
  category: SpendingCategory;
}

export const MERCHANT_RULES_SPEC: TableSpec<MerchantRule> = {
  table: 'merchant_rules',
  columns: {
    wrapped_key: { ddl: 'TEXT NOT NULL' },
    pattern: { ddl: 'TEXT NOT NULL' },
    category: { ddl: 'TEXT NOT NULL' },
  },
  orderBy: 'created_at ASC',
};

// ─── Notas ───────────────────────────────────────────────────────────────────

/**
 * A note: a title and a body in the app's markdown dialect. The body never
 * reaches the server in the clear — it is compressed and encrypted under a key
 * of its own, like a statement's payload — so the title is what lists the note
 * and the only thing Buscar can match.
 */
export interface Note extends SyncedRow {
  title: string;
  /** Base64: the body, compressed then encrypted. */
  body: string;
  /** Base64: the body's own key, wrapped under the household's master key. */
  wrapped_key: string;
}

export const NOTES_SPEC: TableSpec<Note> = {
  table: 'notes',
  columns: {
    title: { ddl: 'TEXT NOT NULL' },
    // Base64 of the sealed body: a note is text, so the row stays small enough
    // to be pulled with its table.
    body: { ddl: 'TEXT NOT NULL' },
    wrapped_key: { ddl: 'TEXT NOT NULL' },
  },
  // The note last written on is the one being looked for; the list groups by
  // the same order.
  orderBy: 'updated_at DESC, created_at DESC',
};

// ─── Viajes ──────────────────────────────────────────────────────────────────

/** What a row of a trip can be: what is still to resolve before leaving, and
 *  the four things that get booked. Also the order the sections are drawn in. */
export const TRIP_KINDS = ['todo', 'ticket', 'lodging', 'booking', 'place'] as const;
export type TripKind = (typeof TRIP_KINDS)[number];

/**
 * A trip: what is booked and what is still missing, in the weeks before it.
 * Its days are stored rather than derived from its rows — a trip exists before
 * anything is booked, and a to-do dated a week early would otherwise move its
 * start.
 */
export interface Trip extends SyncedRow {
  title: string;
  /** yyyy-mm-dd; both null for a trip that exists before its dates do. */
  starts_on: string | null;
  ends_on: string | null;
}

export const TRIPS_SPEC: TableSpec<Trip> = {
  table: 'trips',
  columns: {
    title: { ddl: 'TEXT NOT NULL' },
    // yyyy-mm-dd: the first and the last day away.
    starts_on: { ddl: 'TEXT' },
    ends_on: { ddl: 'TEXT' },
  },
  orderBy: 'starts_on ASC NULLS LAST, title COLLATE NOCASE ASC',
};

/**
 * One row of a trip: a pendiente to resolve before leaving, or something
 * booked — a pasaje, an alojamiento, a reserva, a lugar. Every class uses the
 * same columns and leaves the ones it has no use for null; `on` and `at` are
 * reserved words, hence the names.
 */
export interface TripItem extends SyncedRow {
  trip_id: string;
  kind: TripKind;
  title: string;
  /** The day it starts (yyyy-mm-dd), and the hour when its class has one. */
  on_date: string | null;
  /** HH:MM, or the HH:MM:SS the server writes back. */
  at_time: string | null;
  /** The day it ends: a pasaje's arrival, an alojamiento's last day. */
  ends_on: string | null;
  ends_at: string | null;
  /** IATA codes, a pasaje's only. */
  from_code: string | null;
  to_code: string | null;
  /** Only a `todo` is ever ticked. */
  done: boolean;
  /** Whatever else there is to say about the row: a booking code, an address. */
  comments: string | null;
}

export const TRIP_ITEMS_SPEC: TableSpec<TripItem> = {
  table: 'trip_items',
  columns: {
    trip_id: { ddl: 'TEXT NOT NULL' },
    kind: { ddl: 'TEXT NOT NULL' },
    title: { ddl: 'TEXT NOT NULL' },
    on_date: { ddl: 'TEXT' },
    at_time: { ddl: 'TEXT' },
    ends_on: { ddl: 'TEXT' },
    ends_at: { ddl: 'TEXT' },
    from_code: { ddl: 'TEXT' },
    to_code: { ddl: 'TEXT' },
    done: { ddl: 'INTEGER NOT NULL DEFAULT 0', boolean: true },
    comments: { ddl: 'TEXT' },
  },
  // By date, then by when it was added; the section a row falls in is its class.
  orderBy: 'on_date ASC NULLS LAST, created_at ASC',
};

// ─── Sync order ──────────────────────────────────────────────────────────────

/** Tables no single app owns — the shell's own, and the ones several apps
 *  share — synced before any app's. */
export const SHELL_SPECS: TableSpec[] = [HOUSEHOLD_KEY_SPEC, ATTACHMENTS_SPEC];

/** Every offline-synced table, in sync order. */
export const ALL_SPECS: TableSpec[] = [
  ...SHELL_SPECS,
  CHORES_SPEC,
  SHOPPING_SPEC,
  DATES_SPEC,
  NOTES_SPEC,
  TRIPS_SPEC,
  TRIP_ITEMS_SPEC,
  DOCUMENTS_SPEC,
  STATEMENTS_SPEC,
  MERCHANT_RULES_SPEC,
  RECIPES_SPEC,
  GUIDES_SPEC,
  GUIDE_CHAPTERS_SPEC,
];
