import type { EntryMark } from '../../types';

/** The marks drawn on a note wherever it is listed. The one mark every app
 *  shares can only mean pictures here: what is written is the note itself. */
export function noteMarks(hasAttachments: boolean): EntryMark[] {
  return hasAttachments ? ['comments'] : [];
}
