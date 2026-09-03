import { useCallback } from 'react';
import { DOCUMENTS_SPEC } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { lowercaseTrimmed } from '../../utils/textUtils';

/** Everything the user decides about a document; the row's own columns minus
 *  the engine-managed ones. */
export interface DocumentInput {
  title: string;
  /** yyyy-mm-dd, or null for a document that never expires. */
  expires_on: string | null;
}

/** Local-first documents: add / edit / delete, syncing in the background.
 *  Every action is instant and works offline. */
export function useDocuments() {
  const { items, loading, error, insert, update, remove } = useOfflineTable(DOCUMENTS_SPEC);

  /** Creates a document from everything decided about it, resolving the new
   *  id so the caller can open it to attach its files; undefined for a blank
   *  title or a failed write. */
  const add = useCallback(
    (input: DocumentInput): Promise<string | undefined> => {
      const title = lowercaseTrimmed(input.title);
      if (!title) return Promise.resolve(undefined);
      return insert({ ...input, title });
    },
    [insert],
  );

  const save = useCallback(
    (id: string, patch: Partial<DocumentInput>) => update(id, patch),
    [update],
  );

  return { items, loading, error, add, save, remove };
}
