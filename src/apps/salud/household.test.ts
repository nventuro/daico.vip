import { describe, it, expect } from 'vitest';
import type { Member } from '../../lib/offline/specs';
import { isPet, petNames, viewableMembers } from './household';

function member(id: string, display_name: string, email: string | null): Member {
  return {
    id,
    email,
    display_name,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

const ME = member('m1', 'yo', 'member@example.com');
const OTHER = member('m2', 'otro', 'other@example.com');
const MICHI = member('p1', 'michi', null);
const PELUSA = member('p2', 'pelusa', null);

describe('isPet', () => {
  it('is whoever has no email to sign in with', () => {
    expect(isPet(MICHI)).toBe(true);
    expect(isPet(ME)).toBe(false);
  });
});

describe('viewableMembers', () => {
  it("puts the session's member first and the pets after, in the order the store keeps them", () => {
    expect(viewableMembers([PELUSA, ME, MICHI], 'member@example.com')).toEqual([ME, PELUSA, MICHI]);
  });

  it('leaves the other person out', () => {
    expect(viewableMembers([OTHER, ME, MICHI], 'member@example.com')).toEqual([ME, MICHI]);
  });

  it('finds the member whatever the case the email was written in', () => {
    expect(viewableMembers([ME, MICHI], 'Member@Example.com')).toEqual([ME, MICHI]);
  });

  it('is the pets alone when no row is the session’s', () => {
    expect(viewableMembers([OTHER, MICHI], 'nobody@example.com')).toEqual([MICHI]);
    expect(viewableMembers([OTHER, MICHI], null)).toEqual([MICHI]);
  });
});

describe('petNames', () => {
  it('names the pets by id and nobody else', () => {
    expect(petNames([ME, MICHI, OTHER, PELUSA])).toEqual(
      new Map([
        ['p1', 'michi'],
        ['p2', 'pelusa'],
      ]),
    );
  });
});
