import { describe, it, expect } from 'vitest';
import {
  formatArs,
  formatArsCompact,
  formatPercentDelta,
  formatUsd,
  percentDelta,
  periodShort,
  statementTitle,
} from './labels';

describe('formatArsCompact', () => {
  it.each([
    [1_234_567_800, '$ 12.346m'],
    [123_456_700, '$ 1.235m'],
    [125_000_000, '$ 1.25m'],
    [100_000_000, '$ 1m'],
    [99_999_950, '$ 1m'],
    [99_949_999, '$ 999k'],
    [59_533_160, '$ 595k'],
    [10_000_000, '$ 100k'],
    [9_999_900, '$ 100k'],
    [4_567_800, '$ 45.7k'],
    [59_400, '$ 0.6k'],
    [0, '$ 0'],
    [-1_148_000, '−$ 11.5k'],
    [-123_456_700, '−$ 1.235m'],
  ])('%i cents → %s', (cents, text) => {
    expect(formatArsCompact(cents)).toBe(text);
  });
});

describe('formatArs / formatUsd', () => {
  it('writes the thousands with a comma and the cents after a point', () => {
    expect(formatArs(441_387_492)).toBe('$ 4,413,875');
    expect(formatArs(441_387_492, true)).toBe('$ 4,413,874.92');
    expect(formatArs(-1_800_000)).toBe('−$ 18,000');
    expect(formatUsd(61_744)).toBe('US$ 617.44');
  });
});

describe('percentDelta / formatPercentDelta', () => {
  it('writes a change with its sign', () => {
    expect(formatPercentDelta(percentDelta(149_000, 100_000)!)).toBe('+ 49 %');
    expect(formatPercentDelta(percentDelta(97_000, 100_000)!)).toBe('− 3 %');
  });

  it('writes a month that came to what the one before it did as 0 %', () => {
    expect(formatPercentDelta(percentDelta(100_000, 100_000)!)).toBe('0 %');
    expect(formatPercentDelta(percentDelta(100_400, 100_000)!)).toBe('0 %');
  });

  it('has no change to write against nothing spent', () => {
    expect(percentDelta(100_000, 0)).toBeNull();
  });
});

describe('periodShort / statementTitle', () => {
  it('writes the days covered in numbers, both ends whole', () => {
    expect(periodShort('2026-07-03', '2026-07-30')).toBe('03/07/26 – 30/07/26');
    expect(periodShort('2026-05-29', '2026-07-02')).toBe('29/05/26 – 02/07/26');
    expect(periodShort('2025-12-24', '2026-01-22')).toBe('24/12/25 – 22/01/26');
  });

  it('names a statement with nothing before it by its closing day', () => {
    expect(statementTitle({ previous_closed_on: null, closed_on: '2026-07-30' })).toBe(
      'cierre 30/07/26',
    );
    expect(statementTitle({ previous_closed_on: '2026-07-02', closed_on: '2026-07-30' })).toBe(
      '03/07/26 – 30/07/26',
    );
  });
});
