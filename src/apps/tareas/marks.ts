import type { Chore, EntryMark } from '../../types';

/** The marks drawn on a chore wherever it is listed. Notes and attachments
 *  are one mark: either way there is more to the chore than its title. */
export function choreMarks(chore: Chore, hasAttachments: boolean): EntryMark[] {
  return chore.notes || hasAttachments ? ['notes'] : [];
}
