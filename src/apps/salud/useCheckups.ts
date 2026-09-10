import { useCallback } from 'react';
import { CHECKUPS_SPEC, type Checkup } from '../../lib/offline/specs';
import type { RepeatUnit } from '../../utils/recurrence';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { todayIso } from '../../utils/dateUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { dueAfterMarking } from './recurrence';
import * as engine from '../../lib/offline/engine';

/** Everything the user decides about a checkup; the row's own columns minus
 *  the engine-managed ones, the mark, and whose it is. */
export interface CheckupInput {
  title: string;
  /** yyyy-mm-dd, or null for no date. */
  due_on: string | null;
  comments: string | null;
  repeat_every: number | null;
  repeat_unit: RepeatUnit | null;
}

/** The two repeat columns describe one thing, so they are cleared together and
 *  a stale unit never survives a switch back to a checkup done once. */
function withRepeat<T extends Partial<CheckupInput>>(patch: T, every: number | null): T {
  return every == null ? { ...patch, repeat_every: null, repeat_unit: null } : patch;
}

/** Local-first checkups — the signed-in member's and the pets', since the
 *  server hands out no others: add / edit / mark / delete, syncing in the
 *  background. */
export function useCheckups() {
  const { items, loading, error, insert, update, remove, mutate } = useOfflineTable(CHECKUPS_SPEC);

  /** Creates a checkup of the member being viewed from everything decided
   *  about it, resolving the new id so the caller can open it; undefined for
   *  a blank title or a failed write. */
  const add = useCallback(
    (input: CheckupInput, memberId: string): Promise<string | undefined> => {
      const title = lowercaseTrimmed(input.title);
      if (!title) return Promise.resolve(undefined);
      return insert(
        withRepeat(
          { ...input, title, member_id: memberId, last_done_on: null },
          input.repeat_every,
        ),
      );
    },
    [insert],
  );

  const save = useCallback(
    (id: string, patch: Partial<CheckupInput>) => {
      const every =
        'repeat_every' in patch
          ? (patch.repeat_every ?? null)
          : (items.find((checkup) => checkup.id === id)?.repeat_every ?? null);
      return update(id, withRepeat(patch, every));
    },
    [items, update],
  );

  /** Marks a checkup done today: the day it was marked and, when it repeats,
   *  the day the next one falls on. One write, whatever kind of checkup. */
  const mark = useCallback(
    (checkup: Checkup) =>
      mutate(async () => {
        // The checkup as it is stored, not as it was drawn: an interval typed
        // and saved on leaving the field is what the next date is counted
        // by, whichever came first.
        const stored =
          (await engine.listVisible<Checkup>(CHECKUPS_SPEC)).find((c) => c.id === checkup.id) ??
          checkup;
        const today = todayIso();
        await engine.update(CHECKUPS_SPEC, checkup.id, {
          last_done_on: today,
          due_on: dueAfterMarking(stored, today),
        });
      }),
    [mutate],
  );

  /** Takes a finished checkup's mark off. Its date never moved, so there is
   *  nothing else to put back. */
  const unmark = useCallback((id: string) => update(id, { last_done_on: null }), [update]);

  /** Puts back the mark and the date a copy taken before a mark carries — what
   *  undoing one is, for a checkup that repeats as much as for one that does not. */
  const restore = useCallback(
    (checkup: Checkup) =>
      update(checkup.id, { last_done_on: checkup.last_done_on, due_on: checkup.due_on }),
    [update],
  );

  return { items, loading, error, add, save, mark, unmark, restore, remove };
}
