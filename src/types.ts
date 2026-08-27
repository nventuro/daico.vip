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

/** How a date repeats: never, every year, or every `repeat_months` months. */
export const REPEAT_KINDS = ['none', 'yearly', 'months'] as const;
export type RepeatKind = (typeof REPEAT_KINDS)[number];

/**
 * A calendar entry — a birthday, an appointment, a renewal. Not a task: nothing
 * is ever done, and the app never rewrites a row on its own. `occurs_on` is the
 * anchor the user entered; a recurring entry's next occurrence is computed from
 * it on read, so it rolls over by itself. Like every offline-synced row, `id` is
 * a client-generated UUID and `updated_at` is the last-write-wins key.
 */
export interface DateEntry {
  id: string;
  title: string;
  /** The anchor: the ISO date (yyyy-mm-dd) entered by the user, never moved by the app. */
  occurs_on: string;
  repeat: RepeatKind;
  /** Interval in months when `repeat` is 'months'; null otherwise. */
  repeat_months: number | null;
  /** How many days ahead the entry shows on the home screen (0 = only on the day). */
  notice_days: number;
  notes: string | null;
  /** ISO timestamp. */
  created_at: string;
  /** ISO timestamp; the last-write-wins conflict key. */
  updated_at: string;
}

/**
 * A recipe: a title and a markdown body in the app's dialect (an
 * `:::ingredients` block renders as a tickable list). Created with only a title
 * and written afterwards, so an empty body is normal. Like every offline-synced
 * row, `id` is a client-generated UUID and `updated_at` is the last-write-wins
 * key.
 */
export interface Recipe {
  id: string;
  title: string;
  body: string;
  /** Total time in minutes, when known. */
  minutes: number | null;
  /** How many portions it yields, when known. */
  servings: number | null;
  /** ISO timestamp. */
  created_at: string;
  /** ISO timestamp; the last-write-wins conflict key. */
  updated_at: string;
}

/** Filename of the local OPFS-backed SQLite database used for offline data. */
export const LOCAL_DB_PATH = 'daico-local.sqlite3';

/**
 * Name of the OPFS SAH-pool VFS the local database is opened through. This VFS
 * persists to OPFS without needing `SharedArrayBuffer` (and therefore no
 * COOP/COEP headers, which the static host can't set), at the cost of a single
 * connection per origin — hence the single-tab lock below.
 */
export const LOCAL_DB_VFS_NAME = 'daico-opfs-sahpool';

/**
 * Web Locks name held for a tab's lifetime by whichever tab owns the local
 * database. The SAH-pool VFS allows only one connection per origin, so a second
 * tab must not open it; it shows the "already open elsewhere" notice instead.
 */
export const DB_OWNER_LOCK = 'daico-db-owner';

/** Max length accepted for a shopping item name (input guard). */
export const SHOPPING_ITEM_NAME_MAX = 120;

/** Milliseconds in one day, for calendar-day arithmetic. */
export const MS_PER_DAY = 86_400_000;

/** Months in a year, for calendar-month arithmetic. */
export const MONTHS_PER_YEAR = 12;

/**
 * Beyond ±this many days a relative date label switches to the spelled date.
 * Within it, days ahead are named by weekday alone, so this must stay under 7
 * or a name could mean either of two days.
 */
export const RELATIVE_DAY_LIMIT = 6;

/** How long (ms) an undo bar stays up after marking a task done. */
export const UNDO_MS = 5000;

/** Privacy-enhanced YouTube embed base; append the video id. */
export const YOUTUBE_EMBED_URL = 'https://www.youtube-nocookie.com/embed/';

/** YouTube watch page base; append the video id. */
export const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v=';

/** How many days ahead a pending chore shows on the home screen's upcoming list. */
export const CHORE_NOTICE_DAYS = 3;

/** Most upcoming entries the home screen shows before offering the full list. */
export const UPCOMING_MAX_ROWS = 4;

/** Notice window (days ahead) a new date gets unless the user picks another. */
export const DATE_NOTICE_DAYS_DEFAULT = 7;

/** Notice windows (days ahead) offered when adding or editing a date. */
export const DATE_NOTICE_DAYS_OPTIONS = [0, 1, 3, 7, 14, 30] as const;

/** Interval a date gets when switched to repeating every N months. */
export const DATE_REPEAT_MONTHS_DEFAULT = 3;

/** Bounds for a date's every-N-months interval (input guard). */
export const DATE_REPEAT_MONTHS_MIN = 1;
export const DATE_REPEAT_MONTHS_MAX = 24;

/** Smallest value accepted for a recipe's minutes or servings (input guard). */
export const RECIPE_QUANTITY_MIN = 1;

/** Pause in typing (ms) before the search box runs a search. */
export const SEARCH_DEBOUNCE_MS = 200;

/** Characters shown either side of a match in a search result excerpt. */
export const SEARCH_EXCERPT_RADIUS = 40;

/** Most results a single app contributes to a search. */
export const SEARCH_MAX_HITS_PER_APP = 20;
