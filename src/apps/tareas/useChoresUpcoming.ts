import { useMemo } from 'react';
import type { Upcoming } from '../types';
import { todayIso } from '../../utils/dateUtils';
import { useChores } from './useChores';

/** Pending chores due today or overdue, for the home screen. */
export function useChoresUpcoming(): Upcoming[] {
  const { items } = useChores();
  const today = todayIso();
  return useMemo(
    () =>
      items.flatMap((chore): Upcoming[] =>
        !chore.done && chore.due_on != null && chore.due_on <= today
          ? [{ title: chore.title, on: chore.due_on, to: '/tareas', appId: 'tareas' }]
          : [],
      ),
    [items, today],
  );
}
