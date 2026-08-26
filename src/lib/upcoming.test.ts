import { describe, it, expect } from 'vitest';
import type { Upcoming } from '../apps/types';
import { sameUpcoming, sortUpcoming } from './upcoming';

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
    expect(sameUpcoming([], [])).toBe(true);
  });
});
