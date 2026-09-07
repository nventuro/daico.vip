import {
  IconBed,
  IconChecklist,
  IconMapPin,
  IconPlane,
  IconQrcode,
  IconTicket,
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';
import type { TripItem, TripKind } from '../../lib/offline/specs';

/** What a class of row is made of, so a section, a form and a row can never
 *  disagree about one. */
export interface TripKindShape {
  /** What stands before the row, and heads its section. */
  icon: TablerIcon;
  /** Whether the row is ticked off; only a pendiente is. */
  ticked: boolean;
  /** When it starts: a day, a day and an hour, or nothing at all. A lugar with
   *  a day and an hour would be a reserva. */
  starts: 'none' | 'day' | 'day-time';
  /** When it ends: an alojamiento's last day, a pasaje's arrival day and hour. */
  ends: 'none' | 'day' | 'day-time';
  /** Whether it goes from one airport to another. */
  airports: boolean;
}

/** Every class, keyed by what the row carries. The sections are drawn in
 *  `TRIP_KINDS` order, which is where that order lives. */
export const TRIP_KIND_SHAPES: Record<TripKind, TripKindShape> = {
  todo: { icon: IconChecklist, ticked: true, starts: 'day', ends: 'none', airports: false },
  ticket: { icon: IconPlane, ticked: false, starts: 'day-time', ends: 'day-time', airports: true },
  lodging: { icon: IconBed, ticked: false, starts: 'day', ends: 'day', airports: false },
  booking: { icon: IconTicket, ticked: false, starts: 'day-time', ends: 'none', airports: false },
  place: { icon: IconMapPin, ticked: false, starts: 'none', ends: 'none', airports: false },
};

/** The class a row starts as: what is typed into the add bar is far more often
 *  something still to resolve than something already booked. */
export const TRIP_KIND_DEFAULT: TripKind = 'todo';

/** What stands before a staged boarding pass under review: no class of row,
 *  but the files a flight is boarded with. */
export const BOARDING_PASS_ICON: TablerIcon = IconQrcode;

/** Whether a pasaje is a flight — one between two airports. The class also
 *  covers a bus leg, which has no airports and nothing to check in for. */
export function isFlight(item: Pick<TripItem, 'kind' | 'from_code' | 'to_code'>): boolean {
  return item.kind === 'ticket' && item.from_code !== null && item.to_code !== null;
}
