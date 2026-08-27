import { describe, it, expect } from 'vitest';
import type { Upcoming } from '../apps/types';
import { groupByDay, sameUpcoming, sortUpcoming } from './upcoming';

const chore: Upcoming = { title: 'Regar', on: '2026-03-14', to: '/tareas', appId: 'tareas' };
const birthday: Upcoming = { title: 'Cumple', on: '2026-03-13', to: '/fechas/1', appId: 'fechas' };
const sameDay: Upcoming = { title: 'Ñandú', on: '2026-03-14', to: '/fechas/2', appId: 'fechas' };

describe('sortUpcoming', () => {
  it('orders by date, then title', () => {
    expect(sortUpcoming([sameDay, chore, birthday])).toEqual([birthday, sameDay, chore]);
  });

  it('does not modify the input', () => {
    const input = [chore, birthday];
    sortUpcoming(input);
    expect(input).toEqual([chore, birthday]);
  });
});

describe('sameUpcoming', () => {
  it('compares by value, in order', () => {
    expect(sameUpcoming([chore, birthday], [{ ...chore }, { ...birthday }])).toBe(true);
    expect(sameUpcoming([chore, birthday], [birthday, chore])).toBe(false);
    expect(sameUpcoming([chore], [chore, birthday])).toBe(false);
    expect(sameUpcoming([chore], [{ ...chore, on: '2026-03-15' }])).toBe(false);
    expect(sameUpcoming([chore], [{ ...chore, marks: ['notes'] }])).toBe(false);
    expect(sameUpcoming([{ ...chore, marks: ['notes'] }], [{ ...chore, marks: ['notes'] }])).toBe(true);
    expect(sameUpcoming([], [])).toBe(true);
  });
});

describe('groupByDay', () => {
  // 2026-03-14 is a Saturday.
  const TODAY = '2026-03-14';
  const at = (on: string): Upcoming => ({ title: on, on, to: '/', appId: 'tareas' });

  it('heads the past, each near day, then whole months', () => {
    const groups = groupByDay(
      ['2026-03-10', '2026-03-12', '2026-03-14', '2026-03-15', '2026-03-17', '2026-03-20', '2026-03-21', '2026-03-28', '2026-04-02', '2027-01-05'].map(at),
      TODAY,
    );
    expect(groups.map((g) => [g.label, g.rows.length, g.overdue])).toEqual([
      ['Vencidas', 2, true],
      ['Hoy · Sábado 14', 1, false],
      ['Mañana · Domingo 15', 1, false],
      ['Martes 17', 1, false],
      ['Viernes 20', 1, false],
      ['Marzo', 2, false],
      ['Abril', 1, false],
      ['Enero 2027', 1, false],
    ]);
  });

  it('adds the month to a day heading once the month changes', () => {
    expect(groupByDay([at('2026-04-01')], '2026-03-30').map((g) => g.label)).toEqual([
      'Miércoles 1 abr',
    ]);
  });

  it('is empty for no rows', () => {
    expect(groupByDay([], TODAY)).toEqual([]);
  });
});
