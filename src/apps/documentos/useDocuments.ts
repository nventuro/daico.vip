import { useCallback } from 'react';
import { DOCUMENT_NOTICE_DAYS_DEFAULT, type DocumentEntry } from '../../types';
import { DOCUMENTS_SPEC } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { lowercaseTrimmed } from '../../utils/textUtils';

/** Everything the user decides about a document; the row's own columns minus
 *  the engine-managed ones. */
export interface DocumentInput {
  title: string;
  /** yyyy-mm-dd, or null for a document that never expires. */
  expires_on: string | null;
  notice_days: number;
}

/** Local-first documents: add / edit / delete, syncing in the background.
 *  Every action is instant and works offline. */
export function useDocuments() {
  const { items, loading, error, mutate } = useOfflineTable<DocumentEntry>(DOCUMENTS_SPEC);

  /** Creates a document with just its title, resolving the new id so the
   *  caller can open it to attach its files; undefined for a blank title or a
   *  failed write. */
  const add = useCallback(
    (title: string): Promise<string | undefined> => {
      const value = lowercaseTrimmed(title);
      if (!value) return Promise.resolve(undefined);
      return mutate(() =>
        engine.insert(DOCUMENTS_SPEC, {
          title: value,
          expires_on: null,
          notice_days: DOCUMENT_NOTICE_DAYS_DEFAULT,
        }),
      );
    },
    [mutate],
  );

  const save = useCallback(
    (id: string, patch: Partial<DocumentInput>) =>
      mutate(() => engine.update(DOCUMENTS_SPEC, id, patch)),
    [mutate],
  );

  const remove = useCallback(
    (entry: DocumentEntry) => mutate(() => engine.remove(DOCUMENTS_SPEC, entry.id)),
    [mutate],
  );

  return { items, loading, error, add, save, remove };
}
