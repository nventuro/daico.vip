import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Attachment, Checkup, Member } from '../../lib/offline/specs';
import type { AttachmentOwnerKind } from '../../types';
import { addDays, todayIso } from '../../utils/dateUtils';

const TODAY = todayIso();

function member(id: string, display_name: string, email: string | null): Member {
  return {
    id,
    email,
    display_name,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

/** A checkup of `memberId`'s, due `days` from today. */
function checkup(id: string, memberId: string, days: number): Checkup {
  return {
    id,
    member_id: memberId,
    title: id,
    comments: null,
    due_on: addDays(TODAY, days),
    last_done_on: null,
    repeat_every: null,
    repeat_unit: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

const state: { items: Checkup[]; members: Member[] } = { items: [], members: [] };

vi.mock('./useCheckups', () => ({
  useCheckups: () => ({ items: state.items, loading: false, error: null }),
}));
vi.mock('../../hooks/useMembers', () => ({
  useMembers: () => ({ items: state.members, loading: false }),
}));
vi.mock('../../hooks/useAttachments', () => ({
  useAttachments: () => ({ items: [], loading: false, error: null }),
  ownersWithAttachments: (attachments: Attachment[], kind: AttachmentOwnerKind) =>
    new Set(attachments.filter((a) => a.owner_kind === kind).map((a) => a.owner_id)),
}));

const { useSaludUpcoming } = await import('./useSaludUpcoming');

/** The hook's answer, read out of a render of nothing else. */
function upcoming(): string[] {
  const titles: string[] = [];
  function Probe() {
    for (const entry of useSaludUpcoming() ?? []) titles.push(entry.title);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return titles;
}

describe('useSaludUpcoming', () => {
  it("names a pet's checkup after its title, and a member's own not at all", () => {
    state.members = [member('m1', 'yo', 'member@example.com'), member('p1', 'michi', null)];
    state.items = [checkup('dentista', 'm1', 2), checkup('antirrábica', 'p1', 3)];
    expect(upcoming()).toEqual(['dentista', 'antirrábica · michi']);
  });

  it('leaves the title bare while the household has not come down', () => {
    state.members = [];
    state.items = [checkup('antirrábica', 'p1', 3)];
    expect(upcoming()).toEqual(['antirrábica']);
  });

  it('takes only what is due within the week and not done', () => {
    state.members = [member('p1', 'michi', null)];
    state.items = [
      checkup('pronto', 'p1', 2),
      checkup('lejos', 'p1', 30),
      { ...checkup('hecho', 'p1', 2), last_done_on: TODAY },
    ];
    expect(upcoming()).toEqual(['pronto · michi']);
  });
});
