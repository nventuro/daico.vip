import { TRIP_ROW_FILE_KINDS } from '../../lib/attachmentFiles';
import type { Attachment, TripInboxItem, TripItem } from '../../lib/offline/specs';
import type { EntryMark } from '../../types';
import { inboxFileIds } from './inboxFiles';

/** The marks drawn on a row of a trip wherever it is listed. Comments and
 *  pictures are one mark: either way there is more to the row than its title. */
export function tripItemMarks(item: TripItem, hasAttachments: boolean): EntryMark[] {
  return item.comments || hasAttachments ? ['comments'] : [];
}

/** The rows of a trip that have files — their own, or a boarding pass — by
 *  id: what tells a row with files from one without, wherever it is listed. */
export function tripItemsWithFiles(attachments: Attachment[]): Set<string> {
  return new Set(
    attachments
      .filter((attachment) => TRIP_ROW_FILE_KINDS.includes(attachment.owner_kind))
      .map((attachment) => attachment.owner_id),
  );
}

/** The marks drawn on a staged row under review. Its comments are printed in
 *  full there, so the one mark can only mean a file came with it. */
export function tripInboxMarks(row: TripInboxItem): EntryMark[] {
  return inboxFileIds(row).length > 0 ? ['comments'] : [];
}
