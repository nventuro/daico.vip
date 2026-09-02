import {
  TRIP_KINDS,
  type Trip,
  type TripInboxItem,
  type TripItem,
  type TripKind,
} from '../../lib/offline/specs';
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

/** What one email left to review: its rows, and what they have in common. */
export interface InboxGroup {
  importId: string;
  /** The model's name for the trip the rows belong to. */
  tripTitle: string;
  emailSubject: string;
  /** When the email was read, as an ISO instant: the earliest of its rows. */
  receivedAt: string;
  items: TripInboxItem[];
}

const titleCollator = new Intl.Collator('es');

function instant(iso: string): number {
  return new Date(iso).getTime();
}

/** A group's rows as the review lists them: by class in `TRIP_KINDS` order,
 *  the dated ones first within a class, soonest first, then by title. */
function compareInboxItems(a: TripInboxItem, b: TripInboxItem): number {
  const byKind = TRIP_KINDS.indexOf(a.kind) - TRIP_KINDS.indexOf(b.kind);
  if (byKind !== 0) return byKind;
  if (a.on_date !== b.on_date) {
    if (a.on_date === null) return 1;
    if (b.on_date === null) return -1;
    return a.on_date < b.on_date ? -1 : 1;
  }
  return titleCollator.compare(a.title, b.title);
}

/** The staged rows as the list shows them: one group per email, the one
 *  that came last first. */
export function inboxGroups(rows: TripInboxItem[]): InboxGroup[] {
  const byImport = new Map<string, TripInboxItem[]>();
  for (const row of rows) {
    const items = byImport.get(row.import_id);
    if (items) items.push(row);
    else byImport.set(row.import_id, [row]);
  }
  return [...byImport.entries()]
    .map(([importId, items]) => {
      const first = items.reduce((earliest, row) =>
        instant(row.created_at) < instant(earliest.created_at) ? row : earliest,
      );
      return {
        importId,
        tripTitle: first.trip_title,
        emailSubject: first.email_subject,
        receivedAt: first.created_at,
        items: [...items].sort(compareInboxItems),
      };
    })
    .sort((a, b) => instant(b.receivedAt) - instant(a.receivedAt));
}

/** The choice of creating a trip rather than picking one. A trip's id is a
 *  uuid, so nothing can be mistaken for this. */
export const CREATE_TRIP_CHOICE = 'create';

/**
 * The trips a group of suggestions may go into, in the order the selector
 * offers them: the ones still ahead soonest first, then the ones without
 * dates. A trip already over is not offered at all — what is being booked is
 * never in the past. Expects the rows in the spec's order, like `splitTrips`.
 */
export function inboxTripChoices(trips: Trip[], today: string): Trip[] {
  const { upcoming, undated } = splitTrips(trips, today);
  return [...upcoming, ...undated];
}

/** What the selector starts on: the next trip, or creating one when nothing
 *  is ahead. */
export function suggestedTripChoice(choices: Trip[]): string {
  return choices[0]?.id ?? CREATE_TRIP_CHOICE;
}
