import { describe, it, expect } from 'vitest';
import type { Chore } from '../../types';
import { statusLabel } from './useChoresStatus';

const TODAY = '2026-03-14';

function chore(due_on: string | null, done = false): Chore {
  return {
    id: due_on ?? 'none',
    title: 't',
    notes: null,
    done,
    due_on,
    created_at: '',
    updated_at: '',
  };
}

describe('statusLabel', () => {
  it('is null with nothing pending', () => {
    expect(statusLabel([], TODAY)).toBeNull();
    expect(statusLabel([chore('2026-03-01', true)], TODAY)).toBeNull();
  });

  it('counts pending chores, dated or not', () => {
    expect(statusLabel([chore(null), chore('2026-03-20')], TODAY)).toBe('2 pendientes');
    expect(statusLabel([chore(null)], TODAY)).toBe('1 pendiente');
  });

  it('leads with the overdue count when any is late', () => {
    expect(statusLabel([chore('2026-03-10'), chore(TODAY), chore(null)], TODAY)).toBe(
      '1 vencida · 3 pendientes',
    );
  });

  it('ignores done chores, however old', () => {
    expect(statusLabel([chore('2026-03-01', true), chore(null)], TODAY)).toBe('1 pendiente');
  });
});
