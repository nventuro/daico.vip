import { TRIPS_SPEC, TRIP_ITEMS_SPEC } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { searchTable } from '../../lib/search';
import { todayIso } from '../../utils/dateUtils';
import { entryPath, type SearchHit } from '../types';
import { TRIP_KIND_LABELS, tripDatesLabel } from './labels';

/**
 * Trips whose title mentions `query`, then the rows of any trip whose title or
 * comments do — a booking code and an address are written there, and they
 * travel in the clear, so both can be matched. Each row is shown under the
 * trip it belongs to.
 */
export async function searchTrips(query: string): Promise<SearchHit[]> {
  const today = todayIso();
  const titles = new Map(
    (await engine.listVisible(TRIPS_SPEC)).map((trip) => [trip.id, trip.title]),
  );

  const trips = await searchTable(TRIPS_SPEC, query, {
    fields: ['title'],
    hit: (trip) => ({
      title: trip.title,
      subtitle: tripDatesLabel(trip, today),
      to: entryPath('viajes', trip.id),
    }),
  });
  const items = await searchTable(TRIP_ITEMS_SPEC, query, {
    fields: ['title', 'comments'],
    attachments: 'trip_item',
    hit: (item) => ({
      title: item.title,
      subtitle: [TRIP_KIND_LABELS[item.kind], titles.get(item.trip_id)]
        .filter((part) => part !== undefined)
        .join(' · '),
      to: entryPath('viajes', item.trip_id, item.id),
    }),
  });
  return [...trips, ...items];
}
