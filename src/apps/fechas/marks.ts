import type { DateEntry } from '../../lib/offline/specs';
import type { EntryMark } from '../../types';

/** The marks drawn on a date wherever it is listed. */
export function dateMarks(entry: DateEntry): EntryMark[] {
  const marks: EntryMark[] = [];
  if (entry.repeat_every !== null) marks.push('repeat');
  if (entry.comments) marks.push('comments');
  return marks;
}
