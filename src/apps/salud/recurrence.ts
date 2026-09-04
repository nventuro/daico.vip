import type { Checkup } from '../../lib/offline/specs';
import { formatDayMonth } from '../../utils/dateUtils';
import { addRepeats } from '../../utils/recurrence';

/** Whether a checkup is finished for good: it was marked, and it is not coming
 *  back. One that repeats is never done — it is up to date. */
export function isDone(checkup: Checkup): boolean {
  return checkup.last_done_on !== null && checkup.repeat_every === null;
}

/**
 * The day a checkup is due once it has been marked on `on`: its own day when
 * it does not repeat, and otherwise the next one counted from `on` — never
 * from the day it was due, since a check is worth nothing twice in a row.
 */
export function dueAfterMarking(checkup: Checkup, on: string): string | null {
  const { due_on, repeat_every, repeat_unit } = checkup;
  if (repeat_every === null || repeat_unit === null) return due_on;
  return addRepeats(on, repeat_every, repeat_unit);
}

/** What is said once a checkup is marked on `today`: for one that comes
 *  back, where it went. */
export function markMessage(checkup: Checkup, today: string): string {
  const next = checkup.repeat_every === null ? null : dueAfterMarking(checkup, today);
  return next ? `Hecho · vuelve el ${formatDayMonth(next)}` : 'Control hecho';
}

export interface CheckupGroups {
  /** Still to be done, overdue or not: what the list is about. */
  pending: Checkup[];
  done: Checkup[];
}

/** Checkups split into the two groups the list draws, each keeping the order
 *  it came in. */
export function groupCheckups(checkups: Checkup[]): CheckupGroups {
  return {
    pending: checkups.filter((checkup) => !isDone(checkup)),
    done: checkups.filter(isDone),
  };
}
