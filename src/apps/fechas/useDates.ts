import { useCallback } from 'react';
import { DATES_SPEC, type RepeatKind } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { lowercaseTrimmed } from '../../utils/textUtils';

/** Everything the user decides about a date; the row's own columns minus the
 *  engine-managed ones. */
export interface DateInput {
  title: string;
  occurs_on: string;
  repeat: RepeatKind;
  repeat_months: number | null;
  notice_days: number;
  notes: string | null;
}

/** An interval only makes sense for a 'months' repeat; drop it otherwise so a
 *  stale value never survives a switch to 'yearly' or 'none'. */
function withInterval<T extends Partial<DateInput>>(patch: T, repeat: RepeatKind | undefined): T {
  return repeat === 'months' ? patch : { ...patch, repeat_months: null };
}

/** Local-first dates: add / edit / delete, syncing in the background. Every
 *  action is instant and works offline. */
export function useDates() {
  const { items, loading, error, insert, update, remove } = useOfflineTable(DATES_SPEC);

  const add = useCallback(
    (input: DateInput) => {
      const title = lowercaseTrimmed(input.title);
      if (!title) return Promise.resolve(undefined);
      return insert(withInterval({ ...input, title }, input.repeat));
    },
    [insert],
  );

  const save = useCallback(
    (id: string, patch: Partial<DateInput>) => {
      const repeat = patch.repeat ?? items.find((entry) => entry.id === id)?.repeat;
      return update(id, withInterval(patch, repeat));
    },
    [items, update],
  );

  return { items, loading, error, add, save, remove };
}
