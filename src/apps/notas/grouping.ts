import type { Note } from '../../lib/offline/specs';
import { dayOf, daysUntil, monthLabel, yearMonthOf } from '../../utils/dateUtils';
import { groupRuns } from '../../utils/listUtils';

/** How far back a note counts as this week's. */
export const NOTE_WEEK_DAYS = 7;

/** A run of notes under one heading. */
export interface NoteGroup {
  key: string;
  label: string;
  notes: Note[];
}

function heading(editedOn: string, today: string, currentYear: number): Omit<NoteGroup, 'notes'> {
  // A note edited "ahead" of today (another device's clock ran fast) is this
  // week's, not a month of its own.
  if (daysUntil(today, editedOn) > -NOTE_WEEK_DAYS) return { key: 'week', label: 'Esta semana' };
  const yearMonth = yearMonthOf(editedOn);
  if (yearMonth === yearMonthOf(today)) return { key: 'month', label: 'Este mes' };
  return { key: yearMonth, label: monthLabel(yearMonth, currentYear) };
}

/**
 * Consecutive runs of notes by when each was last written, each with a
 * heading: "Esta semana", what is left of "Este mes", then one per month.
 * Expects notes already in edit order, newest first.
 */
export function groupNotes(notes: Note[], today: string): NoteGroup[] {
  const currentYear = Number(today.slice(0, 4));
  const editedOn = (note: Note) => dayOf(note.updated_at);
  return groupRuns(notes, (note) => heading(editedOn(note), today, currentYear).key).map(
    ({ items }) => ({ ...heading(editedOn(items[0]), today, currentYear), notes: items }),
  );
}
