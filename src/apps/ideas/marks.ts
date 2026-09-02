import type { EntryMark } from '../../types';

/** The marks drawn on an idea wherever it is listed. The one mark every app
 *  shares can only mean pictures here: what is written is the idea itself. */
export function ideaMarks(hasAttachments: boolean): EntryMark[] {
  return hasAttachments ? ['comments'] : [];
}
