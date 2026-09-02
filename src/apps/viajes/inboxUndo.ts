import type { RowInput, TripInboxItem } from '../../lib/offline/specs';

/**
 * What confirming a group of suggestions did, carried to the trip's screen in
 * the navigation so it can be undone there and nowhere else: the rows
 * created, the trip if one was, and the staged rows as they were, to put
 * back.
 */
export interface InboxUndo {
  /** What the undo bar says. */
  label: string;
  tripCreated: boolean;
  tripId: string;
  itemIds: string[];
  staged: TripInboxItem[];
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
  };
}
