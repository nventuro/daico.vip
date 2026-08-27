import { useCallback } from 'react';
import type { Chore } from '../../types';
import { CHORES_SPEC } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
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
  const { items, loading, error, mutate } = useOfflineTable<Chore>(CHORES_SPEC);

  const add = useCallback(
    (title: string, dueOn: string | null) => {
      const value = lowercaseTrimmed(title);
      if (!value) return Promise.resolve();
      return mutate(() =>
        engine.insert(CHORES_SPEC, {
          title: value,
          notes: null,
          done: false,
          due_on: dueOn || null,
        }),
      );
    },
    [mutate],
  );

  const save = useCallback(
    (id: string, patch: Partial<ChoreInput>) => mutate(() => engine.update(CHORES_SPEC, id, patch)),
    [mutate],
  );

  const setDone = useCallback(
    (id: string, done: boolean) => mutate(() => engine.update(CHORES_SPEC, id, { done })),
    [mutate],
  );

  const remove = useCallback(
    (chore: Chore) => mutate(() => engine.remove(CHORES_SPEC, chore.id)),
    [mutate],
  );

  return { items, loading, error, add, save, setDone, remove };
}
