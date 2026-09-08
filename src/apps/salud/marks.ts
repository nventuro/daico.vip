import type { Checkup } from '../../lib/offline/specs';
import type { EntryMark } from '../../types';

/** The marks drawn on a checkup wherever it is listed. Comments and
 *  attachments are one mark, as on a chore: either way there is more to it
 *  than its title. A study carries none: every study has files, so a mark
 *  for them would say nothing. */
export function checkupMarks(checkup: Checkup, hasAttachments: boolean): EntryMark[] {
  const marks: EntryMark[] = [];
  if (checkup.repeat_every !== null) marks.push('repeat');
  if (checkup.comments || hasAttachments) marks.push('comments');
  return marks;
}
