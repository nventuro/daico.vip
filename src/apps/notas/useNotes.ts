import { useCallback } from 'react';
import { NOTES_SPEC } from '../../lib/offline/specs';
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

  /** Creates a note with just its title and an empty body, resolving the new
   *  id so the caller can open it for writing; undefined for a blank title or
   *  a failed write. */
  const add = useCallback(
    async (title: string, masterKey: CryptoKey): Promise<string | undefined> => {
      const value = lowercaseTrimmed(title);
      if (!value) return undefined;
      return insert({ title: value, ...(await sealBody(masterKey, '')) });
    },
    [insert],
  );

  const save = useCallback(
    async (id: string, { title, text }: NoteInput, masterKey: CryptoKey) =>
      update(id, { title, ...(await sealBody(masterKey, text)) }),
    [update],
  );

  return { items, loading, error, add, save, remove };
}
