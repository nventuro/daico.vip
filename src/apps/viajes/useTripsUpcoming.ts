import { useMemo } from 'react';
import { daysUntil, isPast, withinNotice } from '../../utils/dateUtils';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import { entryPath, upcomingFrom, type Upcoming } from '../types';
import { isFlight } from './kinds';
import { boardingPassDueLabel } from './labels';
import { tripItemMarks, tripItemsWithFiles } from './marks';
import { useTripItems } from './useTripItems';
import { useToday } from '../../hooks/useToday';

/** How many days ahead a dated pendiente shows on the home screen. */
const TRIP_TODO_NOTICE_DAYS = 7;

/** How many days ahead of a flight its missing boarding pass is asked for:
 *  the day before, when the airline lets one check in. */
const BOARDING_PASS_NOTICE_DAYS = 1;

/**
 * What of every trip the home screen announces: the pendientes that are
 * dated and still open, and — from the day before a flight until it has
 * left — the boarding pass the flight still lacks. Nothing else of a trip
 * is announced: a pasaje, an alojamiento or a reserva is something already
 * resolved, and the trip itself is not a task. The boarding pass is no row
 * of any table: it is read off the flight and its files, and goes away with
 * the first file put on the flight's shelf.
 */
export function useTripsUpcoming(): Upcoming[] | undefined {
  const { items, loading } = useTripItems();
  const { items: attachments } = useAttachments();
  const today = useToday();
  return useMemo(() => {
    const withFiles = tripItemsWithFiles(attachments);
    const withPasses = ownersWithAttachments(attachments, 'boarding_pass');
    return upcomingFrom({ items, loading }, (item) => {
      if (item.kind === 'todo') {
        return !item.done &&
          item.on_date !== null &&
          withinNotice(today, item.on_date, TRIP_TODO_NOTICE_DAYS)
          ? {
              title: item.title,
              on: item.on_date,
              to: entryPath('viajes', item.trip_id, item.id),
              appId: 'viajes',
              marks: tripItemMarks(item, withFiles.has(item.id)),
            }
          : null;
      }
      // A flight that has left asks for nothing, so this is never overdue.
      return isFlight(item) &&
        item.on_date !== null &&
        !isPast(item.on_date, today) &&
        daysUntil(today, item.on_date) <= BOARDING_PASS_NOTICE_DAYS &&
        !withPasses.has(item.id)
        ? {
            title: boardingPassDueLabel(item.title),
            on: item.on_date,
            to: entryPath('viajes', item.trip_id, item.id),
            appId: 'viajes',
          }
        : null;
    });
  }, [items, loading, attachments, today]);
}
