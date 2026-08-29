import { useMemo } from 'react';
import { daysUntil, todayIso } from '../../utils/dateUtils';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import { entryPath, upcomingFrom, type Upcoming } from '../types';
import { useChores } from './useChores';
import { choreMarks } from './marks';

/** How many days ahead a pending chore shows on the home screen's upcoming list. */
const CHORE_NOTICE_DAYS = 3;

/** Pending chores that are overdue or due within the next few days, for the
 *  home screen. */
export function useChoresUpcoming(): Upcoming[] | undefined {
  const { items, loading } = useChores();
  const { items: attachments } = useAttachments();
  const today = todayIso();
  return useMemo(() => {
    const attached = ownersWithAttachments(attachments, 'chore');
    return upcomingFrom({ items, loading }, (chore) =>
      !chore.done && chore.due_on != null && daysUntil(today, chore.due_on) <= CHORE_NOTICE_DAYS
        ? {
            title: chore.title,
            on: chore.due_on,
            to: entryPath('tareas', chore.id),
            appId: 'tareas',
            marks: choreMarks(chore, attached.has(chore.id)),
          }
        : null,
    );
  }, [items, loading, attachments, today]);
}
