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

/**
 * A fact about an entry that is drawn as a small icon on its row wherever the
 * entry is listed — in its app and on the home screen alike. `notes` also
 * stands for attachments: to the row, something written and something attached
 * are the same thing.
 */
export type EntryMark = 'notes' | 'repeat';

/** The kinds of entry an attachment can belong to. */
export const ATTACHMENT_OWNER_KINDS = ['chore', 'document'] as const;
export type AttachmentOwnerKind = (typeof ATTACHMENT_OWNER_KINDS)[number];

/** The entry an attachment belongs to. */
export interface AttachmentOwner {
  kind: AttachmentOwnerKind;
  id: string;
}

/**
 * A picture attached to an entry. Only this metadata is a synced row; the
 * picture itself lives encrypted in the attachments bucket under the row's
 * id, and only ever changes by being replaced with a new attachment.
 * Like every offline-synced row, `id` is a client-generated UUID and
 * `updated_at` is the last-write-wins key.
 */
export interface Attachment {
  id: string;
  owner_kind: AttachmentOwnerKind;
  owner_id: string;
  /** What the user called it; empty for an attachment left unnamed. */
  name: string;
  mime: string;
  /** Of the file itself, before encryption, in bytes. */
  size: number;
  /** Base64: the file's own key, wrapped under the household's master key. */
  wrapped_file_key: string;
  /** ISO timestamp. */
  created_at: string;
  /** ISO timestamp; the last-write-wins conflict key. */
  updated_at: string;
}

/**
 * The household's master key, wrapped under a key derived from the phrase the
 * members hold on paper, with the derivation parameters. One row per
 * household; synced so a device can unlock offline once it has pulled it.
 */
export interface HouseholdKey {
  id: string;
  kdf: 'pbkdf2-sha256';
  /** Base64. */
  salt: string;
  iterations: number;
  /** Base64: the AES-KW wrap of the master key. */
  wrapped_master_key: string;
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

/**
 * A document — a passport, an ID, a policy — whose content is its attachments:
 * the pictures of it. The row holds only what lists it and announces
 * its expiry; anything sensitive (a number, a date of birth) stays inside the
 * encrypted files. Like every offline-synced row, `id` is a client-generated
 * UUID and `updated_at` is the last-write-wins key.
 */
export interface DocumentEntry {
  id: string;
  title: string;
  /** When it stops being valid (yyyy-mm-dd), if it ever does. */
  expires_on: string | null;
  /** How many days ahead of its expiry the document shows on the home screen. */
  notice_days: number;
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

/** Notice window (days ahead of its expiry) a new document gets. */
export const DOCUMENT_NOTICE_DAYS_DEFAULT = 30;

/** Notice windows offered for a document's expiry — up to six months, the
 *  margin a passport is often required to have left. */
export const DOCUMENT_NOTICE_DAYS_OPTIONS = [7, 30, 90, 180] as const;

/** Smallest value accepted for a recipe's minutes or servings (input guard). */
export const RECIPE_QUANTITY_MIN = 1;

/** Pause in typing (ms) before the search box runs a search. */
export const SEARCH_DEBOUNCE_MS = 200;

/** Characters shown either side of a match in a search result excerpt. */
export const SEARCH_EXCERPT_RADIUS = 40;

/** Most results a single app contributes to a search. */
export const SEARCH_MAX_HITS_PER_APP = 20;

/** Largest file accepted as an attachment, in bytes. */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Picture types accepted as attachments — what both supported browsers can
 *  show — and the extension a file of each gets when it leaves the app. */
export const ATTACHMENT_FILE_TYPES: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** JPEG quality a picture is encoded at once it has been cropped or rotated. */
export const ATTACHMENT_JPEG_QUALITY = 0.9;

/** Longest side, in pixels, of the copy a picture is cropped on: enough to
 *  place a crop, small enough for a phone to redraw at once on each turn. */
export const ATTACHMENT_PREVIEW_MAX_PX = 1600;

/** How far a finger must travel across the lightbox to change picture, in pixels. */
export const LIGHTBOX_SWIPE_MIN_PX = 50;

/** Navigation state a link into the lightbox carries when it is followed from
 *  the entry's own page, so that closing can simply go back to it. */
export const LIGHTBOX_FROM_ENTRY_PAGE = { fromEntryPage: true } as const;

/** The storage bucket holding the encrypted attachment files. */
export const ATTACHMENTS_BUCKET = 'attachments';

/**
 * How old a bucket object with no attachment row must be before the orphan
 * sweep removes it. Younger ones may belong to a row another device created
 * and this one hasn't pulled yet.
 */
export const ATTACHMENT_ORPHAN_MIN_AGE_MS = 60 * 60 * 1000;

/** Objects fetched per page when listing the attachments bucket. */
export const ATTACHMENT_LIST_PAGE = 1000;

/** Words in the household phrase. */
export const HOUSEHOLD_PHRASE_WORDS = 6;

/** PBKDF2 rounds a phrase goes through to derive the key that wraps the master key. */
export const HOUSEHOLD_KEY_KDF_ITERATIONS = 600_000;

/** IndexedDB database and store holding this device's unwrapped master key. */
export const MASTER_KEY_DB = 'daico-keys';
export const MASTER_KEY_STORE = 'keys';
