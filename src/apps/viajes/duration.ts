import type { TripItem } from '../../lib/offline/specs';
import { instantIn } from '../../utils/dateUtils';
import { airportZone } from './airports';
import { isFlight } from './kinds';

/** What of a pasaje says how long it takes: its days and hours, what it
 *  travels on, and where each end is, with the zone a train or a bus was
 *  staged with. */
export type Journey = Pick<
  TripItem,
  | 'kind'
  | 'transport'
  | 'on_date'
  | 'at_time'
  | 'ends_on'
  | 'ends_at'
  | 'origin'
  | 'destination'
  | 'origin_time_zone'
  | 'destination_time_zone'
>;

const MS_PER_MINUTE = 60_000;

/** The time zone one end of a journey keeps its clocks in: a flight's
 *  airport's, and whatever a train or a bus says of its own. */
function zoneOf(journey: Journey, place: string | null, zone: string | null): string | null {
  if (!isFlight(journey)) return zone;
  return place === null ? null : airportZone(place);
}

/**
 * How many minutes a pasaje takes, its two hours each read in its own end's
 * time zone — the very thing a list of local hours hides; null while either
 * hour or either zone is not known, and for a journey that would arrive
 * before it leaves. An arrival with no day of its own is on the day it
 * leaves, as the row reads it.
 */
export function journeyMinutes(journey: Journey): number | null {
  if (journey.kind !== 'ticket' || !journey.on_date || !journey.at_time || !journey.ends_at) {
    return null;
  }
  const leavesIn = zoneOf(journey, journey.origin, journey.origin_time_zone);
  const arrivesIn = zoneOf(journey, journey.destination, journey.destination_time_zone);
  if (!leavesIn || !arrivesIn) return null;
  const leaves = instantIn(journey.on_date, journey.at_time, leavesIn);
  const arrives = instantIn(journey.ends_on ?? journey.on_date, journey.ends_at, arrivesIn);
  if (leaves === null || arrives === null || arrives <= leaves) return null;
  return Math.round((arrives - leaves) / MS_PER_MINUTE);
}
