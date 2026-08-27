import type { Chore, EntryMark } from '../../types';

/** The marks drawn on a chore wherever it is listed. */
export function choreMarks(chore: Chore): EntryMark[] {
  return chore.notes ? ['notes'] : [];
}
