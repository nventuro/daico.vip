// =============================================================================
// What more than one part of the app has to agree on. Everything else lives
// with whoever owns it: a synced table's row and columns with its spec
// (lib/offline/specs.ts), an app's own tuning in the app, the shell's in the
// shell, an address or a bucket name in config.ts.
// =============================================================================

/**
 * What every offline-synced row carries. `id` is a client-generated UUID, so a
 * row created offline has a stable identity before it ever reaches the server;
 * `updated_at` is the last-write-wins conflict key, set by whoever made the
 * edit and never bumped server-side.
 */
export interface SyncedRow {
  id: string;
  /** ISO timestamp. */
  created_at: string;
  /** ISO timestamp; the last-write-wins conflict key. */
  updated_at: string;
}

/**
 * A fact about an entry that is drawn as a small icon on its row wherever the
 * entry is listed — in its app and on the home screen alike. `comments` also
 * stands for attachments: to the row, something written and something attached
 * are the same thing — which is why in Notas, where the writing is the entry
 * itself, it can only mean an attachment.
 */
export type EntryMark = 'comments' | 'repeat';

/** The kinds of entry an attachment can belong to. */
export type AttachmentOwnerKind =
  'chore' | 'document' | 'note' | 'trip_item' | 'idea' | 'health_record';

/** The entry an attachment belongs to. */
export interface AttachmentOwner {
  kind: AttachmentOwnerKind;
  id: string;
}
