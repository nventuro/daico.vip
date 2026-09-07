import type { AttachmentSource } from '../../hooks/useAttachments';
import { openInboxFile, openInboxKey, rowBinding, type InboxKeyPair } from '../../lib/householdKey';
import type { TripInboxItem } from '../../lib/offline/specs';
import type { AttachmentOwner } from '../../types';
import { CREATE_TRIP_CHOICE, type BoardingPassTarget, type InboxGroup } from './grouping';
import { INBOX_FILES_TABLE, inboxFileIds, readInboxFiles } from './inboxFiles';
import type { InboxUndo } from './inboxUndo';
import { boardingPassAddedLabel, inboxAddedLabel } from './labels';
import { withKindFields, type TripItemInput } from './useTripItems';
import type { TripInput } from './useTrips';

/** A row of a trip as it is written, with the trip it belongs to. */
export type TripItemWrite = TripItemInput & { trip_id: string };

/** The writes confirming or discarding a group needs, as the hooks hand
 *  them out: each resolves the new id, or undefined when nothing was written. */
export interface InboxWrites {
  addTrip: (input: TripInput) => Promise<string | undefined>;
  addItem: (input: TripItemWrite) => Promise<string | undefined>;
  addAttachment: (owner: AttachmentOwner, file: AttachmentSource) => Promise<string | undefined>;
  removeStaged: (id: string) => Promise<unknown>;
  /** Let go of staged files, here and on the server. */
  removeFiles: (fileIds: string[]) => Promise<void>;
}

/** A staged row as the row of a trip it becomes: its class's own columns and
 *  nothing else, under its title as it came — a flight number or a hotel's
 *  name keeps its capitals, unlike what is typed into an add bar. A boarding
 *  pass with no pasaje yet becomes the pasaje it is for. */
export function tripItemFrom(row: TripInboxItem, tripId: string): TripItemWrite {
  return {
    ...withKindFields({
      kind: row.kind === 'boarding_pass' ? 'ticket' : row.kind,
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

/** Every file the group's rows list, once each, in the rows' order. */
export function groupFileIds(group: InboxGroup): string[] {
  return [...new Set(group.items.flatMap(inboxFileIds))];
}

/**
 * The group's files as the attachments they will be, by staged file id: this
 * device's copies (fetched when it lacks some), opened with the inbox key so
 * each can be sealed again for the attachment it becomes. Throws, in the
 * member's words, when a file cannot be had or the household has no inbox
 * key here to open it with; nothing is written either way.
 */
export async function openedFilesOf(
  group: InboxGroup,
  masterKey: CryptoKey,
  pair: InboxKeyPair | undefined,
): Promise<Map<string, AttachmentSource>> {
  const files = new Map<string, AttachmentSource>();
  const ids = groupFileIds(group);
  if (ids.length === 0) return files;
  if (!pair)
    throw new Error(
      'Este dispositivo todavía no tiene la clave con la que se sellaron los archivos.',
    );
  const read = await readInboxFiles(ids);
  const privateKey = await openInboxKey(masterKey, pair);
  for (const file of read) {
    files.set(file.id, {
      name: file.name,
      mime: file.mime,
      size: file.size,
      plain: await openInboxFile(
        privateKey,
        file.wrapped_key,
        file.data,
        rowBinding(INBOX_FILES_TABLE, file.id),
      ),
    });
  }
  return files;
}

/**
 * Puts a group into the chosen trip — created first, without dates, when the
 * choice is to create one — in the group's own order, each row with the
 * files it was printed in as its attachments, each staged row cleared as
 * soon as its own row is written. A write that fails stops it there: what
 * was written stays, what was not stays staged to be confirmed again, and
 * closing the app mid-way leaves at most one row to be confirmed twice. The
 * staged files stay where they are: they go once the undo is over. Resolves
 * what it did, for the undo; undefined when the trip could not be created,
 * in which case nothing was written.
 */
export async function confirmInbox(
  group: InboxGroup,
  choice: string,
  writes: InboxWrites,
  files: ReadonlyMap<string, AttachmentSource> = new Map(),
): Promise<InboxUndo | undefined> {
  const tripCreated = choice === CREATE_TRIP_CHOICE;
  const tripId = tripCreated
    ? await writes.addTrip({ title: group.tripTitle, starts_on: null, ends_on: null })
    : choice;
  if (tripId === undefined) return undefined;
  const itemIds: string[] = [];
  const attachmentIds: string[] = [];
  const staged: TripInboxItem[] = [];
  rows: for (const row of group.items) {
    const id = await writes.addItem(tripItemFrom(row, tripId));
    if (id === undefined) break;
    itemIds.push(id);
    // A file printed on two rows is attached to each: an attachment is one
    // entry's, and either row is looked up on its own.
    for (const fileId of inboxFileIds(row)) {
      const file = files.get(fileId);
      if (!file) continue;
      const attachmentId = await writes.addAttachment({ kind: 'trip_item', id }, file);
      if (attachmentId === undefined) break rows;
      attachmentIds.push(attachmentId);
    }
    await writes.removeStaged(row.id);
    staged.push(row);
  }
  return {
    label: inboxAddedLabel(itemIds.length),
    tripCreated,
    tripId,
    itemId: null,
    itemIds,
    attachmentIds,
    staged,
    fileIds: groupFileIds(group),
  };
}

/**
 * Puts a staged boarding pass on the pasaje it is for — one there is, one
 * made for it in a trip, or one made in a trip made for it too — as
 * attachments of the pasaje's boarding-pass kind, one per file the row
 * lists, and clears the staged row once every file is on. A file this
 * device does not have, or one that could not be attached, stops it there
 * with the row still staged: a boarding pass short of its file is nothing.
 * Resolves what it did, for the undo; undefined when the trip could not be
 * created, in which case nothing was written.
 */
export async function confirmBoardingPass(
  group: InboxGroup,
  target: BoardingPassTarget,
  writes: InboxWrites,
  files: ReadonlyMap<string, AttachmentSource>,
): Promise<InboxUndo | undefined> {
  const [row] = group.items;
  if (!row) return undefined;
  const tripCreated = target.kind === 'new-trip';
  const tripId = tripCreated
    ? await writes.addTrip({ title: group.tripTitle, starts_on: null, ends_on: null })
    : target.tripId;
  if (tripId === undefined) return undefined;
  const itemIds: string[] = [];
  const attachmentIds: string[] = [];
  const staged: TripInboxItem[] = [];
  const fileIds = groupFileIds(group);
  const undo = (flightId: string | null): InboxUndo => ({
    label: boardingPassAddedLabel(attachmentIds.length),
    tripCreated,
    tripId,
    itemId: flightId,
    itemIds,
    attachmentIds,
    staged,
    fileIds,
  });
  let flightId: string;
  if (target.kind === 'flight') {
    flightId = target.flightId;
  } else {
    const id = await writes.addItem(tripItemFrom(row, tripId));
    if (id === undefined) return undo(null);
    itemIds.push(id);
    flightId = id;
  }
  for (const fileId of inboxFileIds(row)) {
    const file = files.get(fileId);
    const attachmentId =
      file && (await writes.addAttachment({ kind: 'boarding_pass', id: flightId }, file));
    if (attachmentId === undefined) return undo(flightId);
    attachmentIds.push(attachmentId);
  }
  await writes.removeStaged(row.id);
  staged.push(row);
  return undo(flightId);
}

/** Clears a group, keeping nothing of it: its rows, then its files. */
export async function discardInbox(
  group: InboxGroup,
  writes: Pick<InboxWrites, 'removeStaged' | 'removeFiles'>,
): Promise<void> {
  for (const row of group.items) await writes.removeStaged(row.id);
  await writes.removeFiles(groupFileIds(group));
}
