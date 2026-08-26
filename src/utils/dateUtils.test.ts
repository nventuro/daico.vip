import { describe, it, expect } from 'vitest';
import {
  addMonths,
  daysUntil,
  formatDayMonth,
  monthLabel,
  relativeDay,
  todayIso,
} from './dateUtils';

// 2026-03-14 is a Saturday.
const TODAY = '2026-03-14';

describe('todayIso', () => {
  it('is a yyyy-mm-dd string', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('daysUntil', () => {
  it('is 0 on the same day', () => {
    expect(daysUntil(TODAY, TODAY)).toBe(0);
  });

  it('counts forward and backward', () => {
    expect(daysUntil(TODAY, '2026-03-20')).toBe(6);
    expect(daysUntil(TODAY, '2026-03-10')).toBe(-4);
  });

  it('crosses a year boundary', () => {
    expect(daysUntil('2026-12-30', '2027-01-02')).toBe(3);
  });

  it('counts the leap day', () => {
    expect(daysUntil('2028-02-28', '2028-03-01')).toBe(2);
  });
});

describe('addMonths', () => {
  it('clamps the day to the target month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-03-31', 1)).toBe('2026-04-30');
  });

  it('carries into the next year', () => {
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15');
    expect(addMonths('2026-05-10', 12)).toBe('2027-05-10');
  });
});

describe('relativeDay', () => {
  it('names the nearest days', () => {
    expect(relativeDay(TODAY, TODAY)).toBe('hoy');
    expect(relativeDay(TODAY, '2026-03-15')).toBe('mañana');
    expect(relativeDay(TODAY, '2026-03-13')).toBe('ayer');
  });

  it('counts days within the relative range', () => {
    expect(relativeDay(TODAY, '2026-03-17')).toBe('en 3 días');
    expect(relativeDay(TODAY, '2026-03-10')).toBe('hace 4 días');
  });

  it('falls back to weekday + dd/mm further out', () => {
    expect(relativeDay(TODAY, '2026-03-28')).toBe('sáb 28/03');
  });
});

describe('monthLabel', () => {
  it('omits the year when it is the current one', () => {
    expect(monthLabel('2026-03', 2026)).toBe('Marzo');
  });

  it('appends the year otherwise', () => {
    expect(monthLabel('2027-01', 2026)).toBe('Enero 2027');
  });
});

describe('formatDayMonth', () => {
  it('formats as dd/mm', () => {
    expect(formatDayMonth('2026-03-05')).toBe('05/03');
  });
});
