import type { TripItem } from '../../lib/offline/specs';
import { isFlight } from './kinds';

/** The one datalist both stations of a pasaje read from. */
export const STATION_LIST_ID = 'viajes-estaciones';

/** The longest a station's or a terminal's name may be. */
export const STATION_MAX_CHARS = 80;

/**
 * The stations and terminals to offer: the ones the household has already
 * left from or arrived at by train or bus, most used first. Nothing is
 * bundled — there is no list of them worth its weight, and where the
 * household goes is private, so the names are read from the device's own
 * rows and never committed.
 */
export function stationOptions(items: readonly TripItem[]): string[] {
  const used = new Map<string, number>();
  for (const item of items) {
    if (item.kind !== 'ticket' || isFlight(item)) continue;
    for (const name of [item.origin, item.destination]) {
      if (name) used.set(name, (used.get(name) ?? 0) + 1);
    }
  }
  return [...used.entries()]
    .sort(([nameA, timesA], [nameB, timesB]) => timesB - timesA || nameA.localeCompare(nameB, 'es'))
    .map(([name]) => name);
}
