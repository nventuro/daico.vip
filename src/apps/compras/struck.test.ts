import { describe, it, expect } from 'vitest';
import { STRUCK_KEPT_MS, struckExpired } from './struck';

const struckAt = Date.parse('2026-09-10T12:00:00.000Z');

describe('struckExpired', () => {
  it('never expires an item still on the list', () => {
    const item = { checked: false, updated_at: new Date(struckAt).toISOString() };
    expect(struckExpired(item, struckAt + 10 * STRUCK_KEPT_MS)).toBe(false);
  });

  it('keeps a struck item until its time is up', () => {
    const item = { checked: true, updated_at: new Date(struckAt).toISOString() };
    expect(struckExpired(item, struckAt)).toBe(false);
    expect(struckExpired(item, struckAt + STRUCK_KEPT_MS - 1)).toBe(false);
  });

  it('expires a struck item once its time is up', () => {
    const item = { checked: true, updated_at: new Date(struckAt).toISOString() };
    expect(struckExpired(item, struckAt + STRUCK_KEPT_MS)).toBe(true);
    expect(struckExpired(item, struckAt + 2 * STRUCK_KEPT_MS)).toBe(true);
  });
});
