import { describe, it, expect } from 'vitest';
import { formatArsCompact } from './labels';

describe('formatArsCompact', () => {
  it.each([
    [123_456_700, '$1.235k'],
    [595_331_600, '$5.953k'],
    [10_000_000, '$100k'],
    [9_999_900, '$100,0k'],
    [4_567_800, '$45,7k'],
    [59_400, '$0,6k'],
    [0, '$0,0k'],
    [-1_148_000, '−$11,5k'],
  ])('%i cents → %s', (cents, text) => {
    expect(formatArsCompact(cents)).toBe(text);
  });
});
