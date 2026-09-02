import type { TripInboxItem } from '../../lib/offline/specs';
import { CREATE_TRIP_CHOICE, type InboxGroup } from './grouping';
import type { InboxUndo } from './inboxUndo';
import { inboxAddedLabel } from './labels';
import { withKindFields, type TripItemInput } from './useTripItems';
import type { TripInput } from './useTrips';

/** A row of a trip as it is written, with the trip it belongs to. */
export type TripItemWrite = TripItemInput & { trip_id: string };

/** The writes confirming or discarding a group needs, as the hooks hand
 *  them out: each resolves the new id, or undefined when nothing was written. */
export interface InboxWrites {
  addTrip: (input: TripInput) => Promise<string | undefined>;
  addItem: (input: TripItemWrite) => Promise<string | undefined>;
  removeStaged: (id: string) => Promise<unknown>;
}

/** A staged row as the row of a trip it becomes: its class's own columns and
 *  nothing else, under its title as it came — a flight number or a hotel's
 *  name keeps its capitals, unlike what is typed into an add bar. */
export function tripItemFrom(row: TripInboxItem, tripId: string): TripItemWrite {
  return {
    ...withKindFields({
      kind: row.kind,
      title: row.title,
      on_date: row.on_date,
      at_time: row.at_time,
      ends_on: row.ends_on,
      ends_at: row.ends_at,
      from_code: row.from_code,
      to_code: row.to_code,
      comments: row.comments,
      done: false,
    }),
    title: row.title.trim(),
    trip_id: tripId,
  };
}

/**
 * Puts a group into the chosen trip — created first, without dates, when the
 * choice is to create one — in the group's own order, then clears the staged
 * rows. Resolves what it did, for the undo; undefined when the trip could not
 * be created, in which case nothing was written.
 */
export async function confirmInbox(
  group: InboxGroup,
  choice: string,
  writes: InboxWrites,
): Promise<InboxUndo | undefined> {
  const tripCreated = choice === CREATE_TRIP_CHOICE;
  const tripId = tripCreated
    ? await writes.addTrip({ title: group.tripTitle, starts_on: null, ends_on: null })
    : choice;
  if (tripId === undefined) return undefined;
  const itemIds: string[] = [];
  for (const row of group.items) {
    const id = await writes.addItem(tripItemFrom(row, tripId));
    if (id !== undefined) itemIds.push(id);
  }
  for (const row of group.items) await writes.removeStaged(row.id);
  return {
    label: inboxAddedLabel(itemIds.length),
    tripCreated,
    tripId,
    itemIds,
    staged: group.items,
  };
}

/** Clears a group, keeping nothing of it. */
export async function discardInbox(
  group: InboxGroup,
  writes: Pick<InboxWrites, 'removeStaged'>,
): Promise<void> {
  for (const row of group.items) await writes.removeStaged(row.id);
}
