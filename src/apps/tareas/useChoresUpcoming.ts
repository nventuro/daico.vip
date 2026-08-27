import { useMemo } from 'react';
import { CHORE_NOTICE_DAYS } from '../../types';
import type { Upcoming } from '../types';
import { daysUntil, todayIso } from '../../utils/dateUtils';
import { useChores } from './useChores';
import { choreMarks } from './marks';

/** Pending chores that are overdue or due within the next few days, for the
 *  home screen. */
export function useChoresUpcoming(): Upcoming[] {
  const { items } = useChores();
  const today = todayIso();
  return useMemo(
    () =>
      items.flatMap((chore): Upcoming[] =>
        !chore.done && chore.due_on != null && daysUntil(today, chore.due_on) <= CHORE_NOTICE_DAYS
          ? [
              {
                title: chore.title,
                on: chore.due_on,
                to: `/tareas/${chore.id}`,
                appId: 'tareas',
                marks: choreMarks(chore),
              },
            ]
          : [],
      ),
    [items, today],
  );
}
