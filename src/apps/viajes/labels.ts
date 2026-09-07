import type { Trip, TripInboxItem, TripItem, TripKind } from '../../lib/offline/specs';
import {
  daysUntil,
  formatDayRange,
  formatTime,
  relativeDay,
  relativeDayTime,
} from '../../utils/dateUtils';
import { countLabel } from '../../utils/textUtils';

/** What each class is called: the word its control offers and its chip states. */
export const TRIP_KIND_LABELS: Record<TripKind, string> = {
  todo: 'Pendiente',
  ticket: 'Pasaje',
  lodging: 'Alojamiento',
  booking: 'Reserva',
  place: 'Lugar',
};

/** What the undo bar says once a pendiente is ticked. */
export const TICK_MESSAGE = 'Pendiente hecho';

/** What each class's section is headed with. */
export const TRIP_SECTION_LABELS: Record<TripKind, string> = {
  todo: 'Pendientes',
  ticket: 'Pasajes',
  lodging: 'Alojamiento',
  booking: 'Reservas',
  place: 'Lugares',
};

/** What a flight's pass is called, the word as the household says it: it
 *  does not change in number. */
export const BOARDING_PASS_LABEL = 'boarding pass';

/** The heading of a pasaje's boarding passes, singular like «Alojamiento». */
export const BOARDING_PASS_SECTION_LABEL = 'Boarding pass';

/** The definite article each class takes, for the sentences it appears in. */
const TRIP_KIND_ARTICLES: Record<TripKind, string> = {
  todo: 'el',
  ticket: 'el',
  lodging: 'el',
  booking: 'la',
  place: 'el',
};

/** The destructive action of a row, as first offered: «Eliminar reserva». */
export function removeItemLabel(kind: TripKind): string {
  return `Eliminar ${TRIP_KIND_LABELS[kind].toLowerCase()}`;
}

/** What is asked before it goes through: «¿Eliminar la reserva?». */
export function removeItemQuestion(kind: TripKind): string {
  return `¿Eliminar ${TRIP_KIND_ARTICLES[kind]} ${TRIP_KIND_LABELS[kind].toLowerCase()}?`;
}

/** How many nights an alojamiento is for. */
export function nightsLabel(nights: number): string {
  return countLabel(nights, 'noche', 'noches');
}

/** What a trip still has to resolve, as its row says it. */
export function pendingLabel(count: number): string {
  return countLabel(count, 'pendiente', 'pendientes');
}

/** Whatever of `parts` there is, in one line; nothing when there is none. */
function joined(parts: (string | undefined)[]): string | undefined {
  const said = parts.filter((part) => part !== undefined);
  return said.length > 0 ? said.join(' · ') : undefined;
}

/** When a trip is, as its own screen and its row say it: the days it covers,
 *  or nothing at all while it has none. */
export function tripDatesLabel(trip: Trip, today: string): string | undefined {
  if (!trip.starts_on) return undefined;
  return trip.ends_on
    ? formatDayRange(trip.starts_on, trip.ends_on)
    : relativeDay(today, trip.starts_on);
}

/** The line under a trip in the list: when it is, and what is left to resolve. */
export function tripSubtitle(trip: Trip, pending: number, today: string): string | undefined {
  return joined([tripDatesLabel(trip, today), pending > 0 ? pendingLabel(pending) : undefined]);
}

/** What of a row its line reads: its class and its days, hours and airports —
 *  which a staged row carries as a trip's row does. */
export type ItemLine = Pick<
  TripItem,
  'kind' | 'on_date' | 'at_time' | 'ends_on' | 'ends_at' | 'from_code' | 'to_code'
>;

/** A moment as a row says it: the day the way a person would, and the hour
 *  after it when there is one. */
function dayAndTime(day: string | null, time: string | null, today: string): string | undefined {
  if (!day) return time ? formatTime(time) : undefined;
  return time ? `${relativeDay(today, day)}, ${formatTime(time)}` : relativeDay(today, day);
}

/** Where a pasaje goes, by the codes it carries; nothing while it has none. */
function routeLabel(item: ItemLine): string | undefined {
  const codes = [item.from_code, item.to_code].filter((code) => code);
  return codes.length > 0 ? codes.join(' → ') : undefined;
}

/** A pasaje's «sáb 12 sep, 8:40 – 11:05» — the arrival day repeated only when
 *  it is another one, which is what keeps an overnight flight from reading as
 *  landing before it left. */
function journeyLabel(item: ItemLine, today: string): string | undefined {
  const departs = dayAndTime(item.on_date, item.at_time, today);
  const sameDay = item.ends_on === null || item.ends_on === item.on_date;
  const arrives = dayAndTime(sameDay ? null : item.ends_on, item.ends_at, today);
  const legs = [departs, arrives].filter((part) => part !== undefined);
  return legs.length > 0 ? legs.join(' – ') : undefined;
}

/** How long an alojamiento is for: «12 → 19 sep · 7 noches». */
function stayLabel(item: ItemLine, today: string): string | undefined {
  if (!item.on_date || !item.ends_on) return dayAndTime(item.on_date, null, today);
  return `${formatDayRange(item.on_date, item.ends_on)} · ${nightsLabel(daysUntil(item.on_date, item.ends_on))}`;
}

/** The line under a row of a trip: everything of it that fits on one line, and
 *  nothing at all for a lugar, which is only an idea. */
export function itemSubtitle(item: ItemLine, today: string): string | undefined {
  switch (item.kind) {
    case 'ticket':
      return joined([routeLabel(item), journeyLabel(item, today)]);
    case 'lodging':
      return stayLabel(item, today);
    case 'booking':
    case 'todo':
      return dayAndTime(item.on_date, item.at_time, today);
    case 'place':
      return undefined;
  }
}

/** A staged boarding pass's line: what it is, then its flight as a pasaje's
 *  line reads. */
export function boardingPassSubtitle(item: Omit<ItemLine, 'kind'>, today: string): string {
  return joined([BOARDING_PASS_LABEL, itemSubtitle({ ...item, kind: 'ticket' }, today)]) ?? '';
}

/** The line under a staged row, whichever kind it is. */
export function inboxItemSubtitle(
  item: Pick<TripInboxItem, keyof ItemLine>,
  today: string,
): string | undefined {
  if (item.kind === 'boarding_pass') return boardingPassSubtitle(item, today);
  return itemSubtitle({ ...item, kind: item.kind }, today);
}

/** What the home screen lists the day before a flight that has no boarding
 *  pass yet: what is missing, and for which pasaje. */
export function boardingPassDueLabel(flightTitle: string): string {
  return `${BOARDING_PASS_LABEL} · ${flightTitle}`;
}

/** How many suggestions a group of them holds. */
export function inboxCountLabel(count: number): string {
  return countLabel(count, 'ítem', 'ítems');
}

/** How many boarding passes: «2 boarding pass». */
export function boardingPassCountLabel(count: number): string {
  return countLabel(count, BOARDING_PASS_LABEL, BOARDING_PASS_LABEL);
}

/** The line under a group in the list: how much it holds — items, or the
 *  boarding passes it is — and when it came. */
export function inboxSubtitle(
  count: number,
  receivedAt: string,
  today: string,
  boardingPass = false,
): string {
  const what = boardingPass ? boardingPassCountLabel(count) : inboxCountLabel(count);
  return `${what} · ${relativeDayTime(today, receivedAt)}`;
}

/** Where a group came from: the subject of the email. */
export function inboxSourceLabel(subject: string): string {
  return `Fuente: «${subject}»`;
}

/** A trip as the selector offers it: its name, and when it is. */
export function tripChoiceLabel(trip: Trip, today: string): string {
  return `${trip.title} · ${tripDatesLabel(trip, today) ?? 'sin fechas'}`;
}

/** The selector's last choice: a trip named as the suggestions were. */
export function createTripLabel(tripTitle: string): string {
  return `Crear viaje «${tripTitle}»`;
}

/** A pasaje as the selector offers it for a boarding pass: which, when it
 *  leaves, and on what trip. */
export function flightChoiceLabel(
  flight: Pick<TripItem, 'title' | 'on_date' | 'at_time'>,
  tripTitle: string,
  today: string,
): string {
  return `${flight.title} · ${dayAndTime(flight.on_date, flight.at_time, today) ?? 'sin fecha'} · ${tripTitle}`;
}

/** The choice of making the pasaje a boarding pass is for, in a trip there is. */
export function createFlightLabel(tripTitle: string): string {
  return `Crear el pasaje en «${tripTitle}»`;
}

/** The selector's last choice for a boarding pass: a trip made for it, named
 *  as the model named it, with the pasaje. */
export function createTripWithFlightLabel(tripTitle: string): string {
  return `Crear viaje «${tripTitle}» con el pasaje`;
}

/** The review's main action: «Agregar 3 ítems». */
export function addInboxLabel(count: number): string {
  return `Agregar ${inboxCountLabel(count)}`;
}

/** The review's main action for a boarding pass, which goes on a pasaje. */
export const ADD_BOARDING_PASS_LABEL = 'Agregar al pasaje';

/** What the undo bar says once they are in the trip. */
export function inboxAddedLabel(count: number): string {
  return count === 1 ? 'Se agregó 1 ítem' : `Se agregaron ${count} ítems`;
}

/** What the undo bar says once a boarding pass's files are on the pasaje. */
export function boardingPassAddedLabel(count: number): string {
  return count === 1
    ? `Se agregó 1 ${BOARDING_PASS_LABEL}`
    : `Se agregaron ${count} ${BOARDING_PASS_LABEL}`;
}
