import { useMemo } from 'react';
import { daysUntil, todayIso } from '../../utils/dateUtils';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import { entryPath, upcomingFrom, type Upcoming } from '../types';
import { tripItemMarks } from './marks';
import { useTripItems } from './useTripItems';

/** How many days ahead a dated pendiente shows on the home screen. */
const TRIP_TODO_NOTICE_DAYS = 7;

/**
 * The pendientes of every trip that are dated and still open, for the home
 * screen. Nothing else of a trip is announced: a pasaje, an alojamiento or a
 * reserva is something already resolved, and the trip itself is not a task.
 */
export function useTripsUpcoming(): Upcoming[] | undefined {
  const { items, loading } = useTripItems();
  const { items: attachments } = useAttachments();
  const today = todayIso();
  return useMemo(() => {
    const attached = ownersWithAttachments(attachments, 'trip_item');
    return upcomingFrom({ items, loading }, (item) =>
      item.kind === 'todo' &&
      !item.done &&
      item.on_date !== null &&
      daysUntil(today, item.on_date) <= TRIP_TODO_NOTICE_DAYS
        ? {
            title: item.title,
            on: item.on_date,
            to: entryPath('viajes', item.trip_id, item.id),
            appId: 'viajes',
            marks: tripItemMarks(item, attached.has(item.id)),
          }
        : null,
    );
  }, [items, loading, attachments, today]);
}
