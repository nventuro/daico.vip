import { describe, it, expect } from 'vitest';
import type { Checkup } from '../../lib/offline/specs';
import { dueAfterMarking, groupCheckups, isDone } from './recurrence';

function checkup(overrides: Partial<Checkup> = {}): Checkup {
  return {
    id: 'c',
    owner: 'member',
    title: 'dentista',
    comments: null,
    due_on: '2026-09-04',
    last_done_on: '2026-03-04',
    repeat_every: 6,
    repeat_unit: 'month',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const once = (overrides: Partial<Checkup> = {}) =>
  checkup({ repeat_every: null, repeat_unit: null, ...overrides });

describe('dueAfterMarking', () => {
  it('counts the next one from the day it was marked, not the day it was due', () => {
    expect(dueAfterMarking(checkup(), '2026-09-10')).toBe('2027-03-10');
  });

  it('counts from the day marked when marked early too', () => {
    expect(dueAfterMarking(checkup(), '2026-08-20')).toBe('2027-02-20');
  });

  it('starts from the mark when a repeating checkup had no date', () => {
    expect(
      dueAfterMarking(
        checkup({ due_on: null, repeat_every: 1, repeat_unit: 'year' }),
        '2026-09-03',
      ),
    ).toBe('2027-09-03');
  });

  it('keeps the day of one that does not repeat', () => {
    expect(dueAfterMarking(once({ due_on: '2026-10-15' }), '2026-10-15')).toBe('2026-10-15');
    expect(dueAfterMarking(once({ due_on: null }), '2026-10-15')).toBeNull();
  });
});

describe('isDone', () => {
  it('is only a marked checkup that does not come back', () => {
    expect(isDone(checkup())).toBe(false);
    expect(isDone(once({ last_done_on: null }))).toBe(false);
    expect(isDone(once({ last_done_on: '2026-10-15' }))).toBe(true);
  });
});

describe('groupCheckups', () => {
  it('splits done from pending, keeping the order given', () => {
    const a = checkup({ id: 'a' });
    const b = once({ id: 'b', last_done_on: '2026-10-15' });
    const c = once({ id: 'c', last_done_on: null });
    expect(groupCheckups([a, b, c])).toEqual({ pending: [a, c], done: [b] });
  });
});
