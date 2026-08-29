import type { Chore } from '../../lib/offline/specs';
import { addDays, daysUntil } from '../../utils/dateUtils';
import { addRepeats, nextOccurrenceOnOrAfter } from '../../utils/recurrence';

/** Beyond this many days ahead a chore waits under «Más adelante» instead of
 *  sitting among the ones there is something to do about. */
export const CHORE_SOON_DAYS = 14;

/** Whether a chore is finished for good: it was marked, and it is not coming
 *  back. A chore that repeats is never done — it is up to date. */
export function isDone(chore: Chore): boolean {
  return chore.last_done_on !== null && chore.repeat_every === null;
}

/**
 * The day a chore is due once it has been marked on `on`: its own day when it
 * does not repeat, and otherwise the next occurrence, counted from whichever
 * end `repeat_from` names — the day it was marked, or the calendar the chore
 * has been on all along.
 */
export function dueAfterMarking(chore: Chore, on: string): string | null {
  const { due_on, repeat_every, repeat_unit, repeat_from } = chore;
  if (repeat_every === null || repeat_unit === null) return due_on;
  if (repeat_from === 'done' || due_on === null) {
    return addRepeats(on, repeat_every, repeat_unit);
  }
  // On a fixed calendar the next one has to clear both the occurrence just
  // done and the day it was marked, so marking it early moves it on all the
  // same and marking it late does not skip a turn.
  const after = addDays(on < due_on ? due_on : on, 1);
  return nextOccurrenceOnOrAfter(due_on, repeat_every, repeat_unit, after) ?? due_on;
}

export interface ChoreGroups {
  /** Overdue, due soon, or with no date at all: what the list is about. */
  soon: Chore[];
  /** Not due for a while — a chore that repeats spends most of its life here. */
  later: Chore[];
  done: Chore[];
}

/**
 * Chores split into the three groups the list draws, each keeping the order it
 * came in (done last, then by date, undated last of the rest).
 */
export function groupChores(chores: Chore[], today: string): ChoreGroups {
  const waits = (chore: Chore) =>
    chore.due_on !== null && daysUntil(today, chore.due_on) > CHORE_SOON_DAYS;
  return {
    soon: chores.filter((chore) => !isDone(chore) && !waits(chore)),
    later: chores.filter((chore) => !isDone(chore) && waits(chore)),
    done: chores.filter(isDone),
  };
}
