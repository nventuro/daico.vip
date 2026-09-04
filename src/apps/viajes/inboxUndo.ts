import type { RowInput, TripInboxItem } from '../../lib/offline/specs';

/**
 * What confirming a group of suggestions did, carried to the trip's screen in
 * the navigation so it can be undone there and nowhere else: the rows and
 * attachments created, the trip if one was, the staged rows as they were, to
 * put back, and the staged files to let go of once the offer is over.
 */
export interface InboxUndo {
  /** What the undo bar says. */
  label: string;
  tripCreated: boolean;
  tripId: string;
  itemIds: string[];
  attachmentIds: string[];
  staged: TripInboxItem[];
  /** The staged files the rows were printed in, still where they were. */
  fileIds: string[];
}

/**
 * What becomes of the staged files once an offer to undo is over. Taken, the
 * rows are back beside their files and nothing is done; over any other way —
 * timed out, replaced, the screen left — the files are let go of, through
 * `release`.
 */
export function settleInboxUndo(
  offer: InboxUndo,
  taken: boolean,
  release: (fileIds: string[]) => void,
): void {
  if (!taken) release(offer.fileIds);
}

/** What the review hands the trip's screen on its way there. */
export function inboxUndoState(undo: InboxUndo): { inboxUndo: InboxUndo } {
  return { inboxUndo: undo };
}

/** The undo a trip's screen arrived with, if it arrived with one. */
export function inboxUndoOf(state: unknown): InboxUndo | undefined {
  const undo = (state as { inboxUndo?: unknown } | null)?.inboxUndo;
  return typeof undo === 'object' && undo !== null && 'itemIds' in undo
    ? (undo as InboxUndo)
    : undefined;
}

/** A staged row as it is written again after an undo, under a fresh id: the
 *  shared `import_id` is what forms the group again. */
export function inboxRowInput(row: TripInboxItem): RowInput<TripInboxItem> {
  return {
    import_id: row.import_id,
    email_subject: row.email_subject,
    trip_title: row.trip_title,
    kind: row.kind,
    title: row.title,
    on_date: row.on_date,
    at_time: row.at_time,
    ends_on: row.ends_on,
    ends_at: row.ends_at,
    from_code: row.from_code,
    to_code: row.to_code,
    comments: row.comments,
    file_ids: row.file_ids,
  };
}
