import { describe, it, expect } from 'vitest';
import type { Chore } from '../../lib/offline/specs';
import { dueAfterMarking, groupChores, isDone, markMessage } from './recurrence';

const TODAY = '2026-09-10';

function chore(overrides: Partial<Chore> & Pick<Chore, 'id'>): Chore {
  return {
    title: overrides.id,
    comments: null,
    due_on: null,
    last_done_on: null,
    repeat_every: null,
    repeat_unit: null,
    repeat_from: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/** A chore that comes back, monthly by default. */
const repeating = (overrides: Partial<Chore> & Pick<Chore, 'id' | 'repeat_from'>) =>
  chore({ repeat_every: 1, repeat_unit: 'month', ...overrides });

describe('isDone', () => {
  it('is a mark on a chore that does not come back', () => {
    expect(isDone(chore({ id: 'a' }))).toBe(false);
    expect(isDone(chore({ id: 'a', last_done_on: TODAY }))).toBe(true);
  });

  it('is never true of a chore that repeats, however recently it was marked', () => {
    const pipeta = repeating({ id: 'p', repeat_from: 'done', due_on: '2026-10-10' });
    expect(isDone({ ...pipeta, last_done_on: TODAY })).toBe(false);
  });
});

describe('dueAfterMarking', () => {
  it('leaves the date of a chore that does not repeat alone', () => {
    expect(dueAfterMarking(chore({ id: 'a', due_on: '2026-09-05' }), TODAY)).toBe('2026-09-05');
    expect(dueAfterMarking(chore({ id: 'a' }), TODAY)).toBeNull();
  });

  describe("counting from the day it was marked ('done')", () => {
    const pipeta = (dueOn: string) => repeating({ id: 'p', repeat_from: 'done', due_on: dueOn });

    it('is a step from today, whether it was marked late or early', () => {
      expect(dueAfterMarking(pipeta('2026-09-05'), TODAY)).toBe('2026-10-10');
      expect(dueAfterMarking(pipeta('2026-09-20'), TODAY)).toBe('2026-10-10');
    });

    it("steps by the chore's own unit", () => {
      const plantas = repeating({
        id: 'r',
        repeat_from: 'done',
        due_on: '2026-09-09',
        repeat_every: 3,
        repeat_unit: 'day',
      });
      expect(dueAfterMarking(plantas, TODAY)).toBe('2026-09-13');
    });
  });

  describe("counting from the calendar ('due')", () => {
    const alquiler = (dueOn: string) => repeating({ id: 'a', repeat_from: 'due', due_on: dueOn });

    it('keeps the day of the month when it is marked on time', () => {
      expect(dueAfterMarking(alquiler('2026-09-10'), TODAY)).toBe('2026-10-10');
    });

    it('keeps the day of the month when it is marked late', () => {
      // Due on the 5th, marked on the 10th: the next one is still the 5th.
      expect(dueAfterMarking(alquiler('2026-09-05'), TODAY)).toBe('2026-10-05');
    });

    it('moves on when it is marked early, instead of staying due', () => {
      expect(dueAfterMarking(alquiler('2026-09-20'), TODAY)).toBe('2026-10-20');
    });

    it('skips no more than one turn when it was left for months', () => {
      expect(dueAfterMarking(alquiler('2026-05-10'), TODAY)).toBe('2026-10-10');
    });

    it('settles on the 28th once a month-end date has passed February', () => {
      // Known and accepted: the next one is counted from the last, so a day
      // clamped by a short month stays clamped from then on.
      const clamped = alquiler('2026-01-31');
      expect(dueAfterMarking(clamped, '2026-01-31')).toBe('2026-02-28');
      expect(dueAfterMarking(alquiler('2026-02-28'), '2026-02-28')).toBe('2026-03-28');
    });
  });
});

describe('groupChores', () => {
  const overdue = chore({ id: 'overdue', due_on: '2026-09-05' });
  const today = chore({ id: 'today', due_on: TODAY });
  const undated = chore({ id: 'undated' });
  const soonest = chore({ id: 'soonest', due_on: '2026-09-24' });
  const later = chore({ id: 'later', due_on: '2026-09-25' });
  const done = chore({ id: 'done', due_on: '2026-09-01', last_done_on: '2026-09-01' });
  const repeats = repeating({ id: 'repeats', repeat_from: 'done', due_on: '2026-10-10' });

  it('handles empty input', () => {
    expect(groupChores([], TODAY)).toEqual({ soon: [], later: [], done: [] });
  });

  it('splits at two weeks ahead, keeping undated chores among the rest', () => {
    const groups = groupChores([overdue, today, soonest, later, undated, done, repeats], TODAY);
    expect(groups.soon.map((c) => c.id)).toEqual(['overdue', 'today', 'soonest', 'undated']);
    expect(groups.later.map((c) => c.id)).toEqual(['later', 'repeats']);
    expect(groups.done.map((c) => c.id)).toEqual(['done']);
  });

  it('leaves a chore that repeats out of the done group', () => {
    const marked = { ...repeats, last_done_on: TODAY };
    expect(groupChores([marked], TODAY).done).toEqual([]);
  });
});

describe('markMessage', () => {
  it('says where a chore that comes back went', () => {
    const pipette = repeating({ id: 'p', repeat_from: 'done', due_on: '2026-09-02' });
    expect(markMessage(pipette, TODAY)).toBe('Hecha · vuelve el 10/10');
  });

  it('says a chore done once is done', () => {
    expect(markMessage(chore({ id: 'b', due_on: TODAY }), TODAY)).toBe('Tarea hecha');
  });
});
