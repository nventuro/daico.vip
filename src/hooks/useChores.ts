import { useCallback } from 'react';
import type { Chore } from '../types';
import { CHORES_SPEC } from '../lib/offline/specs';
import * as engine from '../lib/offline/engine';
import { useOfflineTable } from './useOfflineTable';

/** Local-first chores: add / toggle / delete, syncing in the background. Every
 *  action is instant and works offline. */
export function useChores() {
  const { items, loading, error, mutate } = useOfflineTable<Chore>(CHORES_SPEC);

  const add = useCallback(
    (title: string, dueOn: string | null) => {
      const value = title.trim();
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

  const toggleDone = useCallback(
    (chore: Chore) => mutate(() => engine.update(CHORES_SPEC, chore.id, { done: !chore.done })),
    [mutate],
  );

  const remove = useCallback(
    (chore: Chore) => mutate(() => engine.remove(CHORES_SPEC, chore.id)),
    [mutate],
  );

  return { items, loading, error, add, toggleDone, remove };
}
