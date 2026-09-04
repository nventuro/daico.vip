import { useCallback } from 'react';
import { IDEAS_SPEC } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { lowercaseTrimmed } from '../../utils/textUtils';

/** Everything the user decides about an idea: its title, the group it is
 *  filed under — `''` for none — and the body as it is written. */
export interface IdeaInput {
  title: string;
  group_name: string;
  body: string;
}

/** Local-first ideas: add / edit / delete, syncing in the background. Every
 *  action is instant and works offline. */
export function useIdeas() {
  const { items, loading, error, insert, update, remove } = useOfflineTable(IDEAS_SPEC);

  /** Creates an idea, resolving the new id so the caller can open it;
   *  undefined for a blank title or a failed write. */
  const add = useCallback(
    (input: IdeaInput): Promise<string | undefined> => {
      const title = lowercaseTrimmed(input.title);
      if (!title) return Promise.resolve(undefined);
      return insert({ ...input, title });
    },
    [insert],
  );

  return { items, loading, error, add, save: update, remove };
}
