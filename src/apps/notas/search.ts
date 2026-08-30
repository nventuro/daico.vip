import { NOTES_SPEC } from '../../lib/offline/specs';
import { searchTable } from '../../lib/search';
import { dayOf, relativeDay, todayIso } from '../../utils/dateUtils';
import { entryPath, type SearchHit } from '../types';

/**
 * Notes whose title mentions `query`, with when each was last written, then
 * attachments named so, under the note they belong to. Only the title is
 * matched: the body is sealed, and opening every note on every keystroke is
 * what Gastos stays out of search for.
 */
export async function searchNotes(query: string): Promise<SearchHit[]> {
  const today = todayIso();
  return searchTable(NOTES_SPEC, query, {
    fields: ['title'],
    attachments: 'note',
    hit: (note) => ({
      title: note.title,
      subtitle: relativeDay(today, dayOf(note.updated_at)),
      to: entryPath('notas', note.id),
    }),
  });
}
