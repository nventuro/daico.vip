import { describe, it, expect } from 'vitest';
import { parentPath } from './parentPath';

describe('parentPath', () => {
  it('drops the last segment', () => {
    expect(parentPath('/guias/a/b')).toBe('/guias/a');
    expect(parentPath('/guias')).toBe('/');
  });

  it('keeps the root at the root', () => {
    expect(parentPath('/')).toBe('/');
  });

  it('ignores a trailing slash', () => {
    expect(parentPath('/guias/')).toBe('/');
  });
});
