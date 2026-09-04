import type { TripInboxItem, TripItem } from '../../lib/offline/specs';
import type { EntryMark } from '../../types';
import { inboxFileIds } from './inboxFiles';

/** The marks drawn on a row of a trip wherever it is listed. Comments and
 *  pictures are one mark: either way there is more to the row than its title. */
export function tripItemMarks(item: TripItem, hasAttachments: boolean): EntryMark[] {
  return item.comments || hasAttachments ? ['comments'] : [];
}

/** The marks drawn on a staged row under review. Its comments are printed in
 *  full there, so the one mark can only mean a PDF came with it. */
export function tripInboxMarks(row: TripInboxItem): EntryMark[] {
  return inboxFileIds(row).length > 0 ? ['comments'] : [];
}
