import { IDEAS_SPEC } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';

/** Everything the user decides about an idea: its title, the group it is
 *  filed under, and the body as it is written. */
export interface IdeaInput {
  title: string;
  group_name: string;
  body: string;
}

/** What an idea being created starts from, and what its draft is compared
 *  against: nothing, so any title and group are worth saving. */
export const NEW_IDEA: IdeaInput = { title: '', group_name: '', body: '' };

/** Local-first ideas: add / edit / delete, syncing in the background. Every
 *  action is instant and works offline. */
export function useIdeas() {
  const { items, loading, error, insert, update, remove } = useOfflineTable(IDEAS_SPEC);
  return { items, loading, error, add: insert, save: update, remove };
}
