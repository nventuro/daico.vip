import { TRIP_KINDS, type Trip, type TripItem, type TripKind } from '../../lib/offline/specs';
import { isPast } from '../../utils/dateUtils';
import { TRIP_SECTION_LABELS } from './labels';

/** One drawn section of a trip: everything of one class it holds. */
export interface TripSection {
  kind: TripKind;
  label: string;
  items: TripItem[];
}

/**
 * A trip's rows as its screen draws them: one section per class in
 * `TRIP_KINDS` order, empty ones left out, and the pendientes already ticked
 * apart. So the pendientes head the screen while any remain and the section
 * disappears on its own once the last is ticked, leaving the bookings on top.
 */
export function tripSections(items: TripItem[]): { sections: TripSection[]; done: TripItem[] } {
  const done = items.filter((item) => item.done);
  const sections = TRIP_KINDS.map((kind) => ({
    kind,
    label: TRIP_SECTION_LABELS[kind],
    items: items.filter((item) => item.kind === kind && !item.done),
  })).filter((section) => section.items.length > 0);
  return { sections, done };
}

/**
 * The trips split as the list shows them: `upcoming` those with dates still to
 * come, soonest first; `undated` those that exist before their dates do;
 * `past` the ones already over, most recent first. Expects the rows in the
 * spec's order (by start, then by title).
 */
export function splitTrips(
  trips: Trip[],
  today: string,
): { upcoming: Trip[]; undated: Trip[]; past: Trip[] } {
  // A trip lasts until its last day, so one already under way is still ahead.
  const lastDay = (trip: Trip) => trip.ends_on ?? trip.starts_on;
  const over = (trip: Trip) => {
    const day = lastDay(trip);
    return day !== null && isPast(day, today);
  };
  return {
    upcoming: trips.filter((trip) => trip.starts_on !== null && !over(trip)),
    undated: trips.filter((trip) => trip.starts_on === null),
    past: trips.filter(over).reverse(),
  };
}

/** How many pendientes each trip still has, by trip id — counted at render,
 *  never stored. */
export function pendingCounts(items: TripItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.kind !== 'todo' || item.done) continue;
    counts.set(item.trip_id, (counts.get(item.trip_id) ?? 0) + 1);
  }
  return counts;
}
