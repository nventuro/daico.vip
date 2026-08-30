import { useCallback } from 'react';
import { DATES_SPEC } from '../../lib/offline/specs';
import type { RepeatUnit } from '../../utils/recurrence';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { lowercaseTrimmed } from '../../utils/textUtils';

/** Everything the user decides about a date; the row's own columns minus the
 *  engine-managed ones. */
export interface DateInput {
  title: string;
  occurs_on: string;
  repeat_every: number | null;
  repeat_unit: RepeatUnit | null;
  notice_days: number;
  comments: string | null;
}

/** A unit only means something alongside an interval, so the two are set and
 *  cleared together and a stale one never survives a switch to «Una vez». */
function withRepeat<T extends Partial<DateInput>>(patch: T, every: number | null): T {
  return every == null ? { ...patch, repeat_every: null, repeat_unit: null } : patch;
}

/** Local-first dates: add / edit / delete, syncing in the background. Every
 *  action is instant and works offline. */
export function useDates() {
  const { items, loading, error, insert, update, remove } = useOfflineTable(DATES_SPEC);

  const add = useCallback(
    (input: DateInput) => {
      const title = lowercaseTrimmed(input.title);
      if (!title) return Promise.resolve(undefined);
      return insert(withRepeat({ ...input, title }, input.repeat_every));
    },
    [insert],
  );

  const save = useCallback(
    (id: string, patch: Partial<DateInput>) => {
      const every =
        'repeat_every' in patch
          ? (patch.repeat_every ?? null)
          : (items.find((entry) => entry.id === id)?.repeat_every ?? null);
      return update(id, withRepeat(patch, every));
    },
    [items, update],
  );

  return { items, loading, error, add, save, remove };
}
