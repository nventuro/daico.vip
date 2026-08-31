import { useCallback } from 'react';
import { TRIPS_SPEC } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';

/** Everything the user decides about a trip; the row's own columns minus the
 *  engine-managed ones. */
export interface TripInput {
  title: string;
  /** yyyy-mm-dd, or null while the trip has no dates yet. */
  starts_on: string | null;
  ends_on: string | null;
}

/** What a trip starts as: a title and no days, since a trip exists long
 *  before its dates do. */
export const NEW_TRIP: TripInput = { title: '', starts_on: null, ends_on: null };

/** Local-first trips: add / edit / delete, syncing in the background. Every
 *  action is instant and works offline. */
export function useTrips() {
  const { items, loading, error, insert, update, remove } = useOfflineTable(TRIPS_SPEC);

  /** Creates a trip, resolving the new id so the caller can open it;
   *  undefined for a blank title or a failed write. A trip is called after a
   *  place, so its name keeps the capitals it was typed with — unlike the
   *  lower-case titles the lists of things to do and buy are kept in. */
  const add = useCallback(
    (input: TripInput): Promise<string | undefined> => {
      const title = input.title.trim();
      if (!title) return Promise.resolve(undefined);
      return insert({ ...input, title });
    },
    [insert],
  );

  const save = useCallback((id: string, patch: Partial<TripInput>) => update(id, patch), [update]);

  return { items, loading, error, add, save, remove };
}
