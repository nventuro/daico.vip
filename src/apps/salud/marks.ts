import type { Checkup } from '../../lib/offline/specs';
import type { EntryMark } from '../../types';

/** The marks drawn on a checkup wherever it is listed. A study carries none:
 *  every study has pictures, so a mark for them would say nothing. */
export function checkupMarks(checkup: Checkup): EntryMark[] {
  const marks: EntryMark[] = [];
  if (checkup.repeat_every !== null) marks.push('repeat');
  if (checkup.comments) marks.push('comments');
  return marks;
}
