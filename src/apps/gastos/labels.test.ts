import { describe, it, expect } from 'vitest';
import { formatArs, formatArsCompact, formatUsd } from './labels';

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
    [0, '$ 0k'],
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
