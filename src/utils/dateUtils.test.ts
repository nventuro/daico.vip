import { describe, it, expect } from 'vitest';
import {
  addDays,
  addMonths,
  daysUntil,
  formatDayMonth,
  formatWeekdayDay,
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

describe('addDays', () => {
  it('moves forward and back across month and year ends', () => {
    expect(addDays('2026-03-14', 1)).toBe('2026-03-15');
    expect(addDays('2026-03-31', 1)).toBe('2026-04-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
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

  it('names the weekday up to the limit ahead', () => {
    expect(relativeDay(TODAY, '2026-03-16')).toBe('lunes');
    expect(relativeDay(TODAY, '2026-03-17')).toBe('martes');
    expect(relativeDay(TODAY, '2026-03-20')).toBe('viernes');
  });

  it('counts days back up to the limit', () => {
    expect(relativeDay(TODAY, '2026-03-12')).toBe('hace 2 días');
    expect(relativeDay(TODAY, '2026-03-08')).toBe('hace 6 días');
  });

  it('spells the date beyond the limit, so a weekday never names two days', () => {
    // 7 days out is a Saturday again, like today.
    expect(relativeDay(TODAY, '2026-03-21')).toBe('sáb 21 mar');
    expect(relativeDay(TODAY, '2026-03-07')).toBe('sáb 7 mar');
    expect(relativeDay(TODAY, '2026-09-18')).toBe('vie 18 sept');
  });

  it('adds the year outside the current one', () => {
    expect(relativeDay(TODAY, '2027-01-15')).toBe('15 ene 2027');
    expect(relativeDay(TODAY, '2025-12-24')).toBe('24 dic 2025');
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

describe('formatWeekdayDay', () => {
  it('names the weekday and day, with the month only when asked', () => {
    expect(formatWeekdayDay('2026-03-14', false)).toBe('Sábado 14');
    expect(formatWeekdayDay('2026-04-01', true)).toBe('Miércoles 1 abr');
  });
});

describe('formatDayMonth', () => {
  it('formats as dd/mm', () => {
    expect(formatDayMonth('2026-03-05')).toBe('05/03');
  });
});
