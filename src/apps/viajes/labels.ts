import type { Trip, TripItem, TripKind } from '../../lib/offline/specs';
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

/** What each class's section is headed with. */
export const TRIP_SECTION_LABELS: Record<TripKind, string> = {
  todo: 'Pendientes',
  ticket: 'Pasajes',
  lodging: 'Alojamiento',
  booking: 'Reservas',
  place: 'Lugares',
};

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

/** A moment as a row says it: the day the way a person would, and the hour
 *  after it when there is one. */
function dayAndTime(day: string | null, time: string | null, today: string): string | undefined {
  if (!day) return time ? formatTime(time) : undefined;
  return time ? `${relativeDay(today, day)}, ${formatTime(time)}` : relativeDay(today, day);
}

/** Where a pasaje goes, by the codes it carries; nothing while it has none. */
function routeLabel(item: TripItem): string | undefined {
  const codes = [item.from_code, item.to_code].filter((code) => code);
  return codes.length > 0 ? codes.join(' → ') : undefined;
}

/** A pasaje's «sáb 12 sep, 8:40 – 11:05» — the arrival day repeated only when
 *  it is another one, which is what keeps an overnight flight from reading as
 *  landing before it left. */
function journeyLabel(item: TripItem, today: string): string | undefined {
  const departs = dayAndTime(item.on_date, item.at_time, today);
  const sameDay = item.ends_on === null || item.ends_on === item.on_date;
  const arrives = dayAndTime(sameDay ? null : item.ends_on, item.ends_at, today);
  const legs = [departs, arrives].filter((part) => part !== undefined);
  return legs.length > 0 ? legs.join(' – ') : undefined;
}

/** How long an alojamiento is for: «12 → 19 sep · 7 noches». */
function stayLabel(item: TripItem, today: string): string | undefined {
  if (!item.on_date || !item.ends_on) return dayAndTime(item.on_date, null, today);
  return `${formatDayRange(item.on_date, item.ends_on)} · ${nightsLabel(daysUntil(item.on_date, item.ends_on))}`;
}

/** The line under a row of a trip: everything of it that fits on one line, and
 *  nothing at all for a lugar, which is only an idea. */
export function itemSubtitle(item: TripItem, today: string): string | undefined {
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

/** How many suggestions a group of them holds. */
export function inboxCountLabel(count: number): string {
  return countLabel(count, 'ítem', 'ítems');
}

/** The line under a group in the list: how much it holds, and when it came. */
export function inboxSubtitle(count: number, receivedAt: string, today: string): string {
  return `${inboxCountLabel(count)} · ${relativeDayTime(today, receivedAt)}`;
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

/** The review's main action: «Agregar 3 ítems». */
export function addInboxLabel(count: number): string {
  return `Agregar ${inboxCountLabel(count)}`;
}

/** What the undo bar says once they are in the trip. */
export function inboxAddedLabel(count: number): string {
  return count === 1 ? 'Se agregó 1 ítem' : `Se agregaron ${count} ítems`;
}
