import { describe, it, expect } from 'vitest';
import type { DateEntry } from '../../lib/offline/specs';
import { displayDate, groupByMonth, isNear, splitByToday } from './recurrence';

const TODAY = '2026-03-14';

function entry(overrides: Partial<DateEntry> & Pick<DateEntry, 'id' | 'occurs_on'>): DateEntry {
  return {
    title: overrides.id,
    repeat_every: null,
    repeat_unit: null,
    notice_days: 7,
    notes: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const yearly = (id: string, occursOn: string) =>
  entry({ id, occurs_on: occursOn, repeat_every: 1, repeat_unit: 'year' });

describe('displayDate', () => {
  it('is the next occurrence for a repeating entry', () => {
    expect(displayDate(yearly('a', '1990-03-14'), '2026-03-15')).toBe('2027-03-14');
  });

  it('is the anchor for a one-off, past or not', () => {
    expect(displayDate(entry({ id: 'a', occurs_on: '2026-03-10' }), TODAY)).toBe('2026-03-10');
  });

  it('falls back to the anchor when no occurrence can be computed', () => {
    const e = entry({ id: 'a', occurs_on: '2026-03-10', repeat_every: 3, repeat_unit: null });
    expect(displayDate(e, TODAY)).toBe('2026-03-10');
  });
});

describe('isNear', () => {
  it('includes today and the notice window, excludes past and beyond', () => {
    expect(isNear('2026-03-14', 7, TODAY)).toBe(true);
    expect(isNear('2026-03-21', 7, TODAY)).toBe(true);
    expect(isNear('2026-03-22', 7, TODAY)).toBe(false);
    expect(isNear('2026-03-13', 7, TODAY)).toBe(false);
    expect(isNear('2026-03-14', 0, TODAY)).toBe(true);
    expect(isNear('2026-03-15', 0, TODAY)).toBe(false);
  });
});

describe('splitByToday', () => {
  it('handles empty input', () => {
    expect(splitByToday([], TODAY)).toEqual({ upcoming: [], past: [] });
  });

  it('puts a yearly entry with a past anchor in upcoming, under next year', () => {
    const birthday = yearly('b', '1990-03-10');
    const { upcoming, past } = splitByToday([birthday], TODAY);
    expect(upcoming).toEqual([birthday]);
    expect(past).toEqual([]);
    expect(displayDate(birthday, TODAY)).toBe('2027-03-10');
  });

  it('puts a one-off from yesterday in past', () => {
    const yesterday = entry({ id: 'y', occurs_on: '2026-03-13' });
    const { upcoming, past } = splitByToday([yesterday], TODAY);
    expect(upcoming).toEqual([]);
    expect(past).toEqual([yesterday]);
  });

  it('sorts upcoming by display date then title, past most recent first', () => {
    const later = entry({ id: 'later', title: 'Zeta', occurs_on: '2026-04-01' });
    const soonB = entry({ id: 'soonB', title: 'beta', occurs_on: '2026-03-20' });
    const soonA = entry({ id: 'soonA', title: 'Alfa', occurs_on: '2026-03-20' });
    const old = entry({ id: 'old', occurs_on: '2026-01-05' });
    const older = entry({ id: 'older', occurs_on: '2025-12-25' });
    const { upcoming, past } = splitByToday([old, later, older, soonB, soonA], TODAY);
    expect(upcoming.map((e) => e.id)).toEqual(['soonA', 'soonB', 'later']);
    expect(past.map((e) => e.id)).toEqual(['old', 'older']);
  });
});

describe('groupByMonth', () => {
  it('handles empty input', () => {
    expect(groupByMonth([], TODAY)).toEqual([]);
  });

  it('groups consecutive months and labels other years', () => {
    const a = entry({ id: 'a', occurs_on: '2026-03-20' });
    const b = entry({ id: 'b', occurs_on: '2026-03-25' });
    const c = entry({ id: 'c', occurs_on: '2027-01-10' });
    const groups = groupByMonth([a, b, c], TODAY);
    expect(groups.map((g) => [g.key, g.label, g.entries.map((e) => e.id)])).toEqual([
      ['2026-03', 'Marzo', ['a', 'b']],
      ['2027-01', 'Enero 2027', ['c']],
    ]);
  });

  it('groups a repeating entry under its next occurrence', () => {
    const [group] = groupByMonth([yearly('b', '1990-03-10')], TODAY);
    expect(group.key).toBe('2027-03');
    expect(group.label).toBe('Marzo 2027');
  });
});
