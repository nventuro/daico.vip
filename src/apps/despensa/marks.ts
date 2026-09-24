import type { PantryItem } from '../../lib/offline/specs';
import type { EntryMark } from '../../types';

/** The marks drawn on an item wherever it is listed. Comments and pictures are
 *  one mark: either way there is more to it than its title. */
export function pantryMarks(item: PantryItem, hasAttachments: boolean): EntryMark[] {
  return item.comments || hasAttachments ? ['comments'] : [];
}
