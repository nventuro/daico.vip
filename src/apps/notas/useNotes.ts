import { useCallback } from 'react';
import { NOTES_SPEC, type Note, type RowInput } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { sealBody } from './body';

/** Everything the user decides about a note: its title, and the body as it is
 *  written — the row's sealed form is this hook's to make. */
export interface NoteInput {
  title: string;
  text: string;
}

/** Local-first notes: add / edit / delete, syncing in the background. Every
 *  action is instant and works offline. The body is sealed here, so nothing
 *  written ever reaches the store in the clear. */
export function useNotes() {
  const { items, loading, error, insert, update, remove } = useOfflineTable(NOTES_SPEC);

  /** Creates a note from its title and what was written, sealed at birth,
   *  resolving the new id so the caller can open it; undefined for a blank
   *  title or a failed write. */
  const add = useCallback(
    async (title: string, text: string, masterKey: CryptoKey): Promise<string | undefined> => {
      const value = lowercaseTrimmed(title);
      if (!value) return undefined;
      return insert({ title: value, ...(await sealBody(masterKey, text)) });
    },
    [insert],
  );

  /** Writes what is given and nothing else: the title as it is, the text
   *  sealed anew. Each travels on its own, so a title kept while the text is
   *  still being written never carries a stale body, nor the other way round. */
  const save = useCallback(
    async (id: string, { title, text }: Partial<NoteInput>, masterKey: CryptoKey) => {
      const patch: Partial<RowInput<Note>> = {};
      if (title !== undefined) patch.title = title;
      if (text !== undefined) Object.assign(patch, await sealBody(masterKey, text));
      return update(id, patch);
    },
    [update],
  );

  return { items, loading, error, add, save, remove };
}
