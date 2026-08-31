import type { TripItem } from '../../lib/offline/specs';
import type { EntryMark } from '../../types';

/** The marks drawn on a row of a trip wherever it is listed. Comments and
 *  pictures are one mark: either way there is more to the row than its title. */
export function tripItemMarks(item: TripItem, hasAttachments: boolean): EntryMark[] {
  return item.comments || hasAttachments ? ['comments'] : [];
}
