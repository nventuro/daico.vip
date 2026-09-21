import {
  TRIP_KINDS,
  type Trip,
  type TripInboxItem,
  type TripItem,
  type TripKind,
} from '../../lib/offline/specs';
import { isPast } from '../../utils/dateUtils';
import { compareLastWritten } from '../../utils/listUtils';
import { normalize } from '../../utils/textUtils';
import {
  TRIP_SECTION_LABELS,
  createTicketLabel,
  createTripWithTicketLabel,
  ticketChoiceLabel,
} from './labels';

/** One drawn section of a trip: everything of one class it holds. */
export interface TripSection {
  kind: TripKind;
  label: string;
  items: TripItem[];
}

/**
 * A trip's rows as its screen draws them: one section per class in
 * `TRIP_KINDS` order, empty ones left out, and the pendientes already ticked
 * apart, the one ticked last first — a tick is a write, and the row keeps no
 * day of its own for it. So the pendientes head the screen while any remain
 * and the section disappears on its own once the last is ticked, leaving the
 * bookings on top.
 */
export function tripSections(items: TripItem[]): { sections: TripSection[]; done: TripItem[] } {
  const done = items.filter((item) => item.done).sort(compareLastWritten);
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

/** What is reviewed as one: an email's bookings, or one flight's boarding pass. */
export interface InboxGroup {
  /** What names the group in a URL: the email's import for bookings, the
   *  staged row's own id for a boarding pass. */
  key: string;
  importId: string;
  /** The model's name for the trip the rows belong to. */
  tripTitle: string;
  emailSubject: string;
  /** When the email was read, as an ISO instant: the earliest of its rows. */
  receivedAt: string;
  items: TripInboxItem[];
  /** Whether the group is one pasaje's boarding pass rather than bookings. */
  boardingPass: boolean;
}

const titleCollator = new Intl.Collator('es');

function instant(iso: string): number {
  return new Date(iso).getTime();
}

/** A group's rows as the review lists them: by class in `TRIP_KINDS` order,
 *  the dated ones first within a class, soonest first, then by title. */
function compareInboxItems(a: TripInboxItem, b: TripInboxItem): number {
  const kinds: readonly string[] = TRIP_KINDS;
  const byKind = kinds.indexOf(a.kind) - kinds.indexOf(b.kind);
  if (byKind !== 0) return byKind;
  if (a.on_date !== b.on_date) {
    if (a.on_date === null) return 1;
    if (b.on_date === null) return -1;
    return a.on_date < b.on_date ? -1 : 1;
  }
  return titleCollator.compare(a.title, b.title);
}

function groupOf(key: string, items: TripInboxItem[], boardingPass: boolean): InboxGroup {
  const first = items.reduce((earliest, row) =>
    instant(row.created_at) < instant(earliest.created_at) ? row : earliest,
  );
  return {
    key,
    importId: first.import_id,
    tripTitle: first.trip_title,
    emailSubject: first.email_subject,
    receivedAt: first.created_at,
    items: [...items].sort(compareInboxItems),
    boardingPass,
  };
}

/**
 * The staged rows as the list shows them: an email's bookings as one group,
 * and each boarding pass as a group of its own — it is one flight's, and is
 * put on one pasaje at review, even when the email held two legs. The one
 * that came last first.
 */
export function inboxGroups(rows: TripInboxItem[]): InboxGroup[] {
  const byImport = new Map<string, TripInboxItem[]>();
  const passes: TripInboxItem[] = [];
  for (const row of rows) {
    if (row.kind === 'boarding_pass') {
      passes.push(row);
      continue;
    }
    const items = byImport.get(row.import_id);
    if (items) items.push(row);
    else byImport.set(row.import_id, [row]);
  }
  return [
    ...[...byImport.entries()].map(([importId, items]) => groupOf(importId, items, false)),
    ...passes.map((row) => groupOf(row.id, [row], true)),
  ].sort((a, b) => instant(b.receivedAt) - instant(a.receivedAt));
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

/** Where a boarding pass goes: on a pasaje there is, on one made for it in a
 *  trip there is, or on one made in a trip made for it too. */
export type BoardingPassTarget =
  | { kind: 'ticket'; tripId: string; ticketId: string }
  | { kind: 'new-ticket'; tripId: string }
  | { kind: 'new-trip' };

/** One option of the selector a boarding pass is placed with. */
export interface BoardingPassChoice {
  /** What the option is worth to the control; a pasaje's id, or a word no
   *  uuid can be. */
  value: string;
  label: string;
  target: BoardingPassTarget;
}

const NEW_TICKET_PREFIX = 'new:';

/**
 * The places a boarding pass may go, in the selector's order: the pasajes of
 * the trips a booking may go in, trip by trip and soonest first; then a new
 * pasaje in each of those trips; then a new trip, named as the model named
 * it, with the pasaje. Expects `items` in the spec's order (by day).
 */
export function boardingPassChoices(
  trips: Trip[],
  items: TripItem[],
  tripTitle: string,
  today: string,
): BoardingPassChoice[] {
  const candidates = inboxTripChoices(trips, today);
  const tickets = candidates.flatMap((trip) =>
    items
      .filter((item) => item.trip_id === trip.id && item.kind === 'ticket')
      .map((ticket): BoardingPassChoice => ({
        value: ticket.id,
        label: ticketChoiceLabel(ticket, trip.title, today),
        target: { kind: 'ticket', tripId: trip.id, ticketId: ticket.id },
      })),
  );
  const newTickets = candidates.map((trip): BoardingPassChoice => ({
    value: `${NEW_TICKET_PREFIX}${trip.id}`,
    label: createTicketLabel(trip.title),
    target: { kind: 'new-ticket', tripId: trip.id },
  }));
  return [
    ...tickets,
    ...newTickets,
    {
      value: CREATE_TRIP_CHOICE,
      label: createTripWithTicketLabel(tripTitle),
      target: { kind: 'new-trip' },
    },
  ];
}

/** Words as a flight's or a train's number is compared: case, accents and
 *  spacing aside. */
function compact(text: string): string {
  return normalize(text).replace(/\s+/g, '');
}

/**
 * How well a pasaje matches a staged boarding pass: leaving the same day
 * between the same places is best, the same day with one place or none next,
 * and the same number on another day is worth something still; nothing else
 * is, and neither is a pasaje that travels on something else — a train's pass
 * is never a flight's, whatever the day.
 */
function matchScore(row: TripInboxItem, ticket: TripItem): number {
  if (row.transport !== null && ticket.transport !== null && row.transport !== ticket.transport) {
    return 0;
  }
  if (row.on_date !== null && ticket.on_date === row.on_date) {
    const places = [row.origin, row.destination].filter(
      (place, i) => place !== null && place === (i === 0 ? ticket.origin : ticket.destination),
    ).length;
    return 2 + places;
  }
  return compact(ticket.title).includes(compact(row.title)) ? 1 : 0;
}

/**
 * The choice the selector starts on for a staged boarding pass: the pasaje
 * that matches it best, soonest first among equals; with none, a new pasaje
 * in the next trip; with no trip ahead, a new trip.
 */
export function suggestedBoardingPassChoice(
  row: TripInboxItem,
  choices: BoardingPassChoice[],
  items: TripItem[],
): string {
  let best: { value: string; score: number } | null = null;
  for (const { value, target } of choices) {
    if (target.kind !== 'ticket') continue;
    const ticket = items.find((item) => item.id === target.ticketId);
    const score = ticket ? matchScore(row, ticket) : 0;
    if (score > 0 && (best === null || score > best.score)) best = { value, score };
  }
  if (best) return best.value;
  return choices.find((choice) => choice.target.kind === 'new-ticket')?.value ?? CREATE_TRIP_CHOICE;
}
