import type { DateEntry, EntryMark } from '../../types';

/** The marks drawn on a date wherever it is listed. */
export function dateMarks(entry: DateEntry): EntryMark[] {
  const marks: EntryMark[] = [];
  if (entry.repeat !== 'none') marks.push('repeat');
  if (entry.notes) marks.push('notes');
  return marks;
}
