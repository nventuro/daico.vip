import type { Chore } from '../../lib/offline/specs';
import type { EntryMark } from '../../types';

/** The marks drawn on a chore wherever it is listed. Notes and attachments
 *  are one mark: either way there is more to the chore than its title. */
export function choreMarks(chore: Chore, hasAttachments: boolean): EntryMark[] {
  const marks: EntryMark[] = [];
  if (chore.repeat_every !== null) marks.push('repeat');
  if (chore.notes || hasAttachments) marks.push('notes');
  return marks;
}
