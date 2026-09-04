import type { SealedAttachment } from '../../hooks/useAttachments';
import { PDF_TYPE } from '../../lib/attachmentFiles';
import { openInboxKey, rewrapInboxFileKey, type InboxKeyPair } from '../../lib/householdKey';
import type { TripInboxItem } from '../../lib/offline/specs';
import type { AttachmentOwner } from '../../types';
import { CREATE_TRIP_CHOICE, type InboxGroup } from './grouping';
import { inboxFileIds, readInboxFiles } from './inboxFiles';
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
  addAttachment: (owner: AttachmentOwner, file: SealedAttachment) => Promise<string | undefined>;
  removeStaged: (id: string) => Promise<unknown>;
  /** Let go of staged files, here and on the server. */
  removeFiles: (fileIds: string[]) => Promise<void>;
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

/** Every file the group's rows list, once each, in the rows' order. */
export function groupFileIds(group: InboxGroup): string[] {
  return [...new Set(group.items.flatMap(inboxFileIds))];
}

/**
 * The group's files as the attachments they will be, by staged file id: this
 * device's copies (fetched when it lacks some), their keys re-wrapped under
 * the master key so the bytes go in as they are. Throws, in the member's
 * words, when a file cannot be had or the household has no inbox key here to
 * open it with; nothing is written either way.
 */
export async function sealedFilesOf(
  group: InboxGroup,
  masterKey: CryptoKey,
  pair: InboxKeyPair | undefined,
): Promise<Map<string, SealedAttachment>> {
  const files = new Map<string, SealedAttachment>();
  const ids = groupFileIds(group);
  if (ids.length === 0) return files;
  if (!pair)
    throw new Error('Este dispositivo todavía no tiene la clave con la que se sellaron los PDF.');
  const read = await readInboxFiles(ids);
  const privateKey = await openInboxKey(masterKey, pair);
  for (const file of read) {
    files.set(file.id, {
      name: file.name,
      mime: PDF_TYPE,
      size: file.size,
      data: file.data,
      wrappedFileKey: await rewrapInboxFileKey(privateKey, masterKey, file.wrapped_key),
    });
  }
  return files;
}

/**
 * Puts a group into the chosen trip — created first, without dates, when the
 * choice is to create one — in the group's own order, each row with the
 * files it was printed in as its attachments, then clears the staged rows.
 * The staged files stay where they are: they go once the undo is over.
 * Resolves what it did, for the undo; undefined when the trip could not be
 * created, in which case nothing was written.
 */
export async function confirmInbox(
  group: InboxGroup,
  choice: string,
  writes: InboxWrites,
  files: ReadonlyMap<string, SealedAttachment> = new Map(),
): Promise<InboxUndo | undefined> {
  const tripCreated = choice === CREATE_TRIP_CHOICE;
  const tripId = tripCreated
    ? await writes.addTrip({ title: group.tripTitle, starts_on: null, ends_on: null })
    : choice;
  if (tripId === undefined) return undefined;
  const itemIds: string[] = [];
  const attachmentIds: string[] = [];
  for (const row of group.items) {
    const id = await writes.addItem(tripItemFrom(row, tripId));
    if (id === undefined) continue;
    itemIds.push(id);
    // A file printed on two rows is attached to each: an attachment is one
    // entry's, and either row is looked up on its own.
    for (const fileId of inboxFileIds(row)) {
      const file = files.get(fileId);
      if (!file) continue;
      const attachmentId = await writes.addAttachment({ kind: 'trip_item', id }, file);
      if (attachmentId !== undefined) attachmentIds.push(attachmentId);
    }
  }
  for (const row of group.items) await writes.removeStaged(row.id);
  return {
    label: inboxAddedLabel(itemIds.length),
    tripCreated,
    tripId,
    itemIds,
    attachmentIds,
    staged: group.items,
    fileIds: groupFileIds(group),
  };
}

/** Clears a group, keeping nothing of it: its rows, then its files. */
export async function discardInbox(
  group: InboxGroup,
  writes: Pick<InboxWrites, 'removeStaged' | 'removeFiles'>,
): Promise<void> {
  for (const row of group.items) await writes.removeStaged(row.id);
  await writes.removeFiles(groupFileIds(group));
}
