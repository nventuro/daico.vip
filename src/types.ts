/** A household member authorized to access the app (allowlisted by email). */
export interface Member {
  email: string;
  display_name: string;
}

/**
 * A chore / task to be done. Like every offline-synced row, `id` is a
 * client-generated UUID (so a chore added offline has a stable identity) and
 * `updated_at` is the last-write-wins key.
 */
export interface Chore {
  id: string;
  title: string;
  notes: string | null;
  done: boolean;
  /** Optional due date as an ISO date string (yyyy-mm-dd). */
  due_on: string | null;
  /** ISO timestamp. */
  created_at: string;
  /** ISO timestamp; the last-write-wins conflict key. */
  updated_at: string;
}

/**
 * An item on the shared shopping list. The `id` is a client-generated UUID so
 * an item added offline has a stable identity before it ever reaches the
 * server. `updated_at` is the last-write-wins key for offline sync and is set
 * by whoever made the edit (never bumped server-side).
 */
export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  /** ISO timestamp. */
  created_at: string;
  /** ISO timestamp; the last-write-wins conflict key. */
  updated_at: string;
}

/** Filename of the local OPFS-backed SQLite database used for offline data. */
export const LOCAL_DB_PATH = 'daico-local.sqlite3';

/** Max length accepted for a shopping item name (input guard). */
export const SHOPPING_ITEM_NAME_MAX = 120;
