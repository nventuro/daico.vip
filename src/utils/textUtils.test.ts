import { describe, it, expect } from 'vitest';
import { countLabel } from './textUtils';

describe('countLabel', () => {
  it('picks the singular for exactly one', () => {
    expect(countLabel(1, 'guía', 'guías')).toBe('1 guía');
  });

  it('picks the plural otherwise', () => {
    expect(countLabel(3, 'guía', 'guías')).toBe('3 guías');
    expect(countLabel(0, 'guía', 'guías')).toBe('0 guías');
  });
});
