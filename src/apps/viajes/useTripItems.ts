import { useCallback, useMemo } from 'react';
import { TRIP_ITEMS_SPEC, type TripKind } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { TRIP_KIND_DEFAULT, TRIP_KIND_SHAPES } from './kinds';

/** Everything a form decides about a row of a trip: its own columns minus the
 *  engine-managed ones, the trip it belongs to, and whether it is ticked —
 *  which is the list's to say and never a form's. */
export interface TripItemFields {
  kind: TripKind;
  title: string;
  on_date: string | null;
  at_time: string | null;
  ends_on: string | null;
  ends_at: string | null;
  from_code: string | null;
  to_code: string | null;
  comments: string | null;
}

/** What a row is written from: its fields, plus the tick only a pendiente
 *  ever carries. */
export interface TripItemInput extends TripItemFields {
  done: boolean;
}

/** What a row starts as, before its class or anything else is chosen. */
export const NEW_TRIP_ITEM: TripItemFields = {
  kind: TRIP_KIND_DEFAULT,
  title: '',
  on_date: null,
  at_time: null,
  ends_on: null,
  ends_at: null,
  from_code: null,
  to_code: null,
  comments: null,
};

/** Every class uses the same columns and leaves the ones it has no use for
 *  null, so what the class does not draw is cleared here rather than kept from
 *  whichever class the row was being written as a moment earlier. */
export function withKindFields(input: TripItemInput): TripItemInput {
  const shape = TRIP_KIND_SHAPES[input.kind];
  return {
    ...input,
    on_date: shape.starts === 'none' ? null : input.on_date,
    at_time: shape.starts === 'day-time' ? input.at_time : null,
    ends_on: shape.ends === 'none' ? null : input.ends_on,
    ends_at: shape.ends === 'day-time' ? input.ends_at : null,
    from_code: shape.airports ? input.from_code : null,
    to_code: shape.airports ? input.to_code : null,
    done: shape.ticked ? input.done : false,
  };
}

/**
 * Local-first rows of a trip: one trip's when `tripId` is given, every trip's
 * otherwise — which is what counts a trip's pendientes in the list and what
 * reaches the home screen.
 */
export function useTripItems(tripId?: string) {
  const { items: all, loading, error, insert, update, remove } = useOfflineTable(TRIP_ITEMS_SPEC);

  const items = useMemo(
    () => (tripId === undefined ? all : all.filter((item) => item.trip_id === tripId)),
    [all, tripId],
  );

  /** Creates a row on `trip`, resolving its new id; undefined for a blank
   *  title or a failed write. */
  const add = useCallback(
    (trip: string, input: TripItemInput): Promise<string | undefined> => {
      const title = lowercaseTrimmed(input.title);
      if (!title) return Promise.resolve(undefined);
      return insert({ ...withKindFields(input), title, trip_id: trip });
    },
    [insert],
  );

  // Deliberately not put through `withKindFields`, unlike `add`: a patch is
  // whatever few columns are being written — the tick on its own, say — and a
  // row's class never changes, so there is nothing left over to clear.
  const save = useCallback(
    (id: string, patch: Partial<TripItemInput>) => update(id, patch),
    [update],
  );

  return { items, loading, error, add, save, remove };
}
