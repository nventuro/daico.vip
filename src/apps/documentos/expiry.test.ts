import { describe, it, expect } from 'vitest';
import type { DocumentEntry } from '../../lib/offline/specs';
import { expiryLabel, isExpiring } from './expiry';

const TODAY = '2026-08-27';
const entry = (expires_on: string | null, notice_days = 30): DocumentEntry => ({
  id: 'd',
  title: 'pasaporte',
  expires_on,
  notice_days,
  created_at: '',
  updated_at: '',
});

describe('isExpiring', () => {
  it('is true inside the notice window and on the day', () => {
    expect(isExpiring(entry('2026-09-26'), TODAY)).toBe(true);
    expect(isExpiring(entry('2026-08-27'), TODAY)).toBe(true);
    expect(isExpiring(entry('2027-02-14', 180), TODAY)).toBe(true);
  });

  it('is false while the expiry is further off than the window', () => {
    expect(isExpiring(entry('2026-09-27'), TODAY)).toBe(false);
    expect(isExpiring(entry('2027-02-14'), TODAY)).toBe(false);
  });

  it('stays true once the document has expired', () => {
    expect(isExpiring(entry('2026-01-01'), TODAY)).toBe(true);
    expect(isExpiring(entry('2026-08-26', 0), TODAY)).toBe(true);
  });

  it('is false for a document that never expires', () => {
    expect(isExpiring(entry(null), TODAY)).toBe(false);
  });
});

describe('expiryLabel', () => {
  it('says vence ahead of the day and venció after it', () => {
    expect(expiryLabel('2027-02-14', TODAY)).toBe('vence 14/02/2027');
    expect(expiryLabel('2026-08-27', TODAY)).toBe('vence 27/08/2026');
    expect(expiryLabel('2026-08-26', TODAY)).toBe('venció 26/08/2026');
  });
});
