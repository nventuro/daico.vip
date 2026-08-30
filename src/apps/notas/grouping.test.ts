import { describe, it, expect } from 'vitest';
import type { Note } from '../../lib/offline/specs';
import { groupNotes } from './grouping';

const TODAY = '2026-08-29';

/** A note last written at midday of `day`, so the grouping is read in the
 *  device's own time zone whatever it is. */
function note(id: string, day: string): Note {
  return {
    id,
    created_at: `${day}T12:00:00.000Z`,
    updated_at: new Date(`${day}T12:00:00`).toISOString(),
    title: id,
    body: '',
    wrapped_key: '',
  };
}

describe('grouping notes by when they were written', () => {
  it('heads the week, what is left of the month, and then each month', () => {
    const groups = groupNotes(
      [
        note('hoy', '2026-08-29'),
        note('hace tres días', '2026-08-26'),
        note('hace nueve días', '2026-08-20'),
        note('el mes pasado', '2026-07-17'),
        note('en junio', '2026-06-02'),
      ],
      TODAY,
    );
    expect(groups.map((g) => [g.label, g.notes.map((n) => n.id)])).toEqual([
      ['Esta semana', ['hoy', 'hace tres días']],
      ['Este mes', ['hace nueve días']],
      ['Julio', ['el mes pasado']],
      ['Junio', ['en junio']],
    ]);
  });

  it('names the year of a month that is not this one', () => {
    const groups = groupNotes([note('vieja', '2025-11-04')], TODAY);
    expect(groups.map((g) => g.label)).toEqual(['Noviembre 2025']);
  });

  it('keeps the week going back seven days, and no further', () => {
    const groups = groupNotes(
      [note('al límite', '2026-08-23'), note('un día más', '2026-08-22')],
      TODAY,
    );
    expect(groups.map((g) => g.label)).toEqual(['Esta semana', 'Este mes']);
  });

  it('takes a note written ahead of today as one of this week, not a month of its own', () => {
    expect(groupNotes([note('adelantada', '2026-08-31')], TODAY).map((g) => g.label)).toEqual([
      'Esta semana',
    ]);
  });
});
