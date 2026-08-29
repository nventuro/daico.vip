import { useCallback } from 'react';
import { CHORES_SPEC, type Chore, type RepeatFrom } from '../../lib/offline/specs';
import type { RepeatUnit } from '../../utils/recurrence';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { todayIso } from '../../utils/dateUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { dueAfterMarking } from './recurrence';

/** Everything the user decides about a chore; the row's own columns minus the
 *  engine-managed ones and the mark. */
export interface ChoreInput {
  title: string;
  /** yyyy-mm-dd, or null for no due date. */
  due_on: string | null;
  notes: string | null;
  repeat_every: number | null;
  repeat_unit: RepeatUnit | null;
  repeat_from: RepeatFrom | null;
}

/** The three repeat columns describe one thing, so they are cleared together
 *  and a stale unit never survives a switch back to a chore done once. */
function withRepeat<T extends Partial<ChoreInput>>(patch: T, every: number | null): T {
  return every == null
    ? { ...patch, repeat_every: null, repeat_unit: null, repeat_from: null }
    : patch;
}

/** Local-first chores: add / edit / mark / delete, syncing in the background.
 *  Every action is instant and works offline. */
export function useChores() {
  const { items, loading, error, insert, update, remove } = useOfflineTable(CHORES_SPEC);

  const add = useCallback(
    (title: string, dueOn: string | null) => {
      const value = lowercaseTrimmed(title);
      if (!value) return Promise.resolve(undefined);
      return insert({
        title: value,
        notes: null,
        due_on: dueOn || null,
        last_done_on: null,
        repeat_every: null,
        repeat_unit: null,
        repeat_from: null,
      });
    },
    [insert],
  );

  const save = useCallback(
    (id: string, patch: Partial<ChoreInput>) => {
      const every =
        'repeat_every' in patch
          ? (patch.repeat_every ?? null)
          : (items.find((chore) => chore.id === id)?.repeat_every ?? null);
      return update(id, withRepeat(patch, every));
    },
    [items, update],
  );

  /** Marks a chore done today: the day it was marked and, when it repeats, the
   *  day the next one falls on. One write, whatever kind of chore it is. */
  const mark = useCallback(
    (chore: Chore) => {
      const today = todayIso();
      return update(chore.id, { last_done_on: today, due_on: dueAfterMarking(chore, today) });
    },
    [update],
  );

  /** Takes a finished chore's mark off. Its date never moved, so there is
   *  nothing else to put back. */
  const unmark = useCallback((id: string) => update(id, { last_done_on: null }), [update]);

  /** Puts back the mark and the date a copy taken before a mark carries — what
   *  undoing one is, for a chore that repeats as much as for one that does not. */
  const restore = useCallback(
    (chore: Chore) => update(chore.id, { last_done_on: chore.last_done_on, due_on: chore.due_on }),
    [update],
  );

  return { items, loading, error, add, save, mark, unmark, restore, remove };
}
