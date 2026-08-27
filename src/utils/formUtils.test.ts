import { describe, it, expect } from 'vitest';
import { hasChanges } from './formUtils';

interface Draft {
  title: string;
  due_on: string | null;
  notes: string | null;
}

describe('hasChanges', () => {
  const saved = { title: 'a', due_on: null, notes: 'n', done: false };

  it('is false when every draft field matches', () => {
    const draft: Draft = { title: 'a', due_on: null, notes: 'n' };
    expect(hasChanges(draft, saved)).toBe(false);
  });

  it('is true when any draft field differs', () => {
    const dated: Draft = { title: 'a', due_on: '2026-03-14', notes: 'n' };
    const blankNotes: Draft = { title: 'a', due_on: null, notes: null };
    expect(hasChanges(dated, saved)).toBe(true);
    expect(hasChanges(blankNotes, saved)).toBe(true);
  });

  it('ignores fields the draft does not carry', () => {
    const doneElsewhere = { ...saved, done: true };
    expect(hasChanges({ title: 'a' }, doneElsewhere)).toBe(false);
  });
});
