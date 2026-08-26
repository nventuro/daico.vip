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
  /**
   * Client-owned fractional-index sort key (base-62) for manual ordering.
   * Reordering writes only this column on the moved row. Null sorts last (e.g.
   * a row inserted manually via SQL); the client sets it on every insert.
   */
  position: string | null;
  /** ISO timestamp. */
  created_at: string;
  /** ISO timestamp; the last-write-wins conflict key. */
  updated_at: string;
}

/**
 * An imported reference document. Read-only in the app — rows come from an
 * import script — but offline-synced like every other table, so it carries the
 * standard client-generated `id` and the `updated_at` last-write-wins key.
 */
export interface Guide {
  id: string;
  title: string;
  description: string | null;
  /** ISO timestamp. */
  created_at: string;
  /** ISO timestamp; the last-write-wins conflict key. */
  updated_at: string;
}

/**
 * One readable page of a guide. Chapters are grouped into sections and ordered
 * by `section_position` then `position`. `body` is markdown (CommonMark plus
 * the app's directives for images, videos and spoilers); images are referenced
 * by key and fetched separately.
 */
export interface GuideChapter {
  id: string;
  guide_id: string;
  section_title: string;
  section_position: number;
  position: number;
  title: string;
  body: string;
  /** ISO timestamp. */
  created_at: string;
  /** ISO timestamp; the last-write-wins conflict key. */
  updated_at: string;
}

/** Filename of the local OPFS-backed SQLite database used for offline data. */
export const LOCAL_DB_PATH = 'daico-local.sqlite3';

/** Max length accepted for a shopping item name (input guard). */
export const SHOPPING_ITEM_NAME_MAX = 120;

/** Milliseconds in one day, for calendar-day arithmetic. */
export const MS_PER_DAY = 86_400_000;

/** Months in a year, for calendar-month arithmetic. */
export const MONTHS_PER_YEAR = 12;

/** Beyond ±this many days a relative date label switches to weekday + dd/mm. */
export const RELATIVE_DAY_LIMIT = 6;

/** Privacy-enhanced YouTube embed base; append the video id. */
export const YOUTUBE_EMBED_URL = 'https://www.youtube-nocookie.com/embed/';

/** YouTube watch page base; append the video id. */
export const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v=';
