import { describe, it, expect } from 'vitest';
import {
  addRepeats,
  nextOccurrenceOnOrAfter,
  repeatIntervalLabel,
  repeatLabel,
  repeatUnitsLabel,
} from './recurrence';

describe('addRepeats', () => {
  it('steps by each unit', () => {
    expect(addRepeats('2026-03-14', 3, 'day')).toBe('2026-03-17');
    expect(addRepeats('2026-03-14', 2, 'week')).toBe('2026-03-28');
    expect(addRepeats('2026-03-14', 3, 'month')).toBe('2026-06-14');
    expect(addRepeats('2026-03-14', 1, 'year')).toBe('2027-03-14');
  });

  it('clamps a month-scale step to the end of a shorter month', () => {
    expect(addRepeats('2026-01-31', 1, 'month')).toBe('2026-02-28');
    expect(addRepeats('2024-02-29', 1, 'year')).toBe('2025-02-28');
  });
});

describe('nextOccurrenceOnOrAfter', () => {
  it('returns the anchor when it is the day asked about', () => {
    expect(nextOccurrenceOnOrAfter('1990-03-14', 1, 'year', '2026-03-14')).toBe('2026-03-14');
  });

  it('rolls a yearly anchor on once the day has passed', () => {
    expect(nextOccurrenceOnOrAfter('1990-03-14', 1, 'year', '2026-03-15')).toBe('2027-03-14');
  });

  it('keeps a future anchor as is', () => {
    expect(nextOccurrenceOnOrAfter('2026-03-14', 1, 'year', '2026-01-01')).toBe('2026-03-14');
  });

  it('steps every N months from the anchor', () => {
    expect(nextOccurrenceOnOrAfter('2025-10-01', 3, 'month', '2026-03-14')).toBe('2026-04-01');
  });

  it('steps by days and weeks', () => {
    expect(nextOccurrenceOnOrAfter('2026-03-01', 3, 'day', '2026-03-14')).toBe('2026-03-16');
    expect(nextOccurrenceOnOrAfter('2026-03-02', 2, 'week', '2026-03-14')).toBe('2026-03-16');
  });

  it('clamps a leap-day anchor without drifting', () => {
    expect(nextOccurrenceOnOrAfter('2024-02-29', 1, 'year', '2024-03-01')).toBe('2025-02-28');
    // Derived from the anchor rather than from the last occurrence, so the 29th
    // comes back the next leap year instead of staying on the 28th.
    expect(nextOccurrenceOnOrAfter('2024-02-29', 1, 'year', '2028-01-01')).toBe('2028-02-29');
  });

  it('is null without a usable interval', () => {
    expect(nextOccurrenceOnOrAfter('2026-03-14', null, 'month', '2026-03-14')).toBeNull();
    expect(nextOccurrenceOnOrAfter('2026-03-14', 1, null, '2026-03-14')).toBeNull();
    expect(nextOccurrenceOnOrAfter('2026-03-14', 0, 'month', '2026-03-14')).toBeNull();
  });
});

describe('labels', () => {
  it('names an interval and the field that sets it', () => {
    expect(repeatLabel(1, 'month')).toBe('Cada mes');
    expect(repeatLabel(3, 'month')).toBe('Cada 3 meses');
    expect(repeatLabel(1, 'week')).toBe('Cada semana');
    expect(repeatIntervalLabel('week')).toBe('Cada cuántas semanas');
    expect(repeatUnitsLabel('day')).toBe('días');
  });
});
