import type {
  Trip,
  TripInboxItem,
  TripItem,
  TripKind,
  TripTransport,
} from '../../lib/offline/specs';
import {
  daysUntil,
  formatDayRange,
  formatTime,
  relativeDay,
  relativeDayTime,
} from '../../utils/dateUtils';
import { countLabel } from '../../utils/textUtils';
import { airportLabel } from './airports';
import { isFlight } from './kinds';

/** What each class is called: the word its control offers and its chip states. */
export const TRIP_KIND_LABELS: Record<TripKind, string> = {
  todo: 'Pendiente',
  ticket: 'Pasaje',
  lodging: 'Alojamiento',
  booking: 'Reserva',
  place: 'Lugar',
};

/** What a pasaje travels on, as its page offers it. */
export const TRIP_TRANSPORT_LABELS: Record<TripTransport, string> = {
  flight: 'Avión',
  train: 'Tren',
  bus: 'Micro',
};

/** Where each transport leaves from and arrives, as its field is named. */
export const TRIP_TRANSPORT_PLACES: Record<TripTransport, string> = {
  flight: 'Aeropuerto',
  train: 'Estación',
  bus: 'Terminal',
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

/** What a pasaje is boarded with, the word as the household says it: it
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

/** What of a row its lines read: its class and its days, hours and places —
 *  which a staged row carries as a trip's row does. */
export type ItemLine = Pick<
  TripItem,
  'kind' | 'on_date' | 'at_time' | 'ends_on' | 'ends_at' | 'transport' | 'origin' | 'destination'
>;

/** A moment as a row says it: the day the way a person would, and the hour
 *  after it when there is one. */
function dayAndTime(day: string | null, time: string | null, today: string): string | undefined {
  if (!day) return time ? formatTime(time) : undefined;
  return time ? `${relativeDay(today, day)}, ${formatTime(time)}` : relativeDay(today, day);
}

/** Where a pasaje leaves from or arrives, as a row names it: an airport by
 *  its code and city, a station by the name it carries. */
function placeLabel(item: ItemLine, place: string | null): string | undefined {
  if (!place) return undefined;
  return isFlight(item) ? airportLabel(place) : place;
}

/**
 * A pasaje's two lines, one for each end: when, then where — «sáb 12 sep,
 * 8:40 · AEP Buenos Aires (Aeroparque)» over «11:05 · BRC Bariloche». The
 * moment leads because a line too long is cut at its tail, and the tail of a
 * name is what can be spared. The arrival day is said only when it is another
 * one, which is what keeps an overnight flight from reading as landing before
 * it left.
 */
function journeyLines(item: ItemLine, today: string): string[] {
  const sameDay = item.ends_on === null || item.ends_on === item.on_date;
  const departure = joined([
    dayAndTime(item.on_date, item.at_time, today),
    placeLabel(item, item.origin),
  ]);
  const arrival = joined([
    dayAndTime(sameDay ? null : item.ends_on, item.ends_at, today),
    placeLabel(item, item.destination),
  ]);
  return [departure, arrival].filter((line) => line !== undefined);
}

/** How long an alojamiento is for: «12 → 19 sep · 7 noches». */
function stayLabel(item: ItemLine, today: string): string | undefined {
  if (!item.on_date || !item.ends_on) return dayAndTime(item.on_date, null, today);
  return `${formatDayRange(item.on_date, item.ends_on)} · ${nightsLabel(daysUntil(item.on_date, item.ends_on))}`;
}

/** The lines under a row of a trip: one for most classes, two for a pasaje,
 *  and none at all for a lugar, which is only an idea. */
export function itemLines(item: ItemLine, today: string): string[] {
  switch (item.kind) {
    case 'ticket':
      return journeyLines(item, today);
    case 'lodging':
      return [stayLabel(item, today)].filter((line) => line !== undefined);
    case 'booking':
    case 'todo':
      return [dayAndTime(item.on_date, item.at_time, today)].filter((line) => line !== undefined);
    case 'place':
      return [];
  }
}

/** A staged boarding pass's lines: what it is, then its pasaje as one's
 *  lines read. */
export function boardingPassLines(item: Omit<ItemLine, 'kind'>, today: string): string[] {
  const [first, ...rest] = itemLines({ ...item, kind: 'ticket' }, today);
  return [first === undefined ? BOARDING_PASS_LABEL : `${BOARDING_PASS_LABEL} · ${first}`, ...rest];
}

/** The lines under a staged row, whichever kind it is. */
export function inboxItemLines(item: Pick<TripInboxItem, keyof ItemLine>, today: string): string[] {
  if (item.kind === 'boarding_pass') return boardingPassLines(item, today);
  return itemLines({ ...item, kind: item.kind }, today);
}

/** What the home screen lists ahead of a pasaje that has no boarding pass
 *  yet: what is missing, and for which pasaje. */
export function boardingPassDueLabel(ticketTitle: string): string {
  return `${BOARDING_PASS_LABEL} · ${ticketTitle}`;
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
export function ticketChoiceLabel(
  ticket: Pick<TripItem, 'title' | 'on_date' | 'at_time'>,
  tripTitle: string,
  today: string,
): string {
  return `${ticket.title} · ${dayAndTime(ticket.on_date, ticket.at_time, today) ?? 'sin fecha'} · ${tripTitle}`;
}

/** The choice of making the pasaje a boarding pass is for, in a trip there is. */
export function createTicketLabel(tripTitle: string): string {
  return `Crear el pasaje en «${tripTitle}»`;
}

/** The selector's last choice for a boarding pass: a trip made for it, named
 *  as the model named it, with the pasaje. */
export function createTripWithTicketLabel(tripTitle: string): string {
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
