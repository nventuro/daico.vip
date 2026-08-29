import { useCallback } from 'react';
import { CHORES_SPEC } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { lowercaseTrimmed } from '../../utils/textUtils';

/** Everything the user decides about a chore; the row's own columns minus the
 *  engine-managed ones and `done`. */
export interface ChoreInput {
  title: string;
  /** yyyy-mm-dd, or null for no due date. */
  due_on: string | null;
  notes: string | null;
}

/** Local-first chores: add / edit / complete / delete, syncing in the
 *  background. Every action is instant and works offline. */
export function useChores() {
  const { items, loading, error, insert, update, remove } = useOfflineTable(CHORES_SPEC);

  const add = useCallback(
    (title: string, dueOn: string | null) => {
      const value = lowercaseTrimmed(title);
      if (!value) return Promise.resolve(undefined);
      return insert({ title: value, notes: null, done: false, due_on: dueOn || null });
    },
    [insert],
  );

  const save = useCallback((id: string, patch: Partial<ChoreInput>) => update(id, patch), [update]);

  const setDone = useCallback((id: string, done: boolean) => update(id, { done }), [update]);

  return { items, loading, error, add, save, setDone, remove };
}
