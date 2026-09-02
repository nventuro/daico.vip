import { describe, it, expect, vi } from 'vitest';
import type { TripInboxItem } from '../../lib/offline/specs';
import type { InboxGroup } from './grouping';
import { CREATE_TRIP_CHOICE } from './grouping';
import { confirmInbox, discardInbox, tripItemFrom, type InboxWrites } from './inboxConfirm';

function staged(id: string, overrides: Partial<TripInboxItem> = {}): TripInboxItem {
  return {
    id,
    import_id: 'e1',
    email_subject: 'Fwd: Tu vuelo',
    trip_title: 'Bariloche',
    kind: 'ticket',
    title: 'AR 1420',
    on_date: '2026-09-12',
    at_time: '08:40',
    ends_on: '2026-09-12',
    ends_at: '11:05',
    from_code: 'AEP',
    to_code: 'BRC',
    comments: 'Código QK7T2M',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    ...overrides,
  };
}

const GROUP: InboxGroup = {
  importId: 'e1',
  tripTitle: 'Bariloche',
  emailSubject: 'Fwd: Tu vuelo',
  receivedAt: '2026-09-01T10:00:00Z',
  items: [
    staged('s1'),
    staged('s2', { kind: 'lodging', title: 'Hotel Cormorán ', ends_on: '2026-09-19' }),
    staged('s3', { kind: 'booking', title: 'Autos Pampa · alquiler de auto' }),
  ],
};

/** Writes that remember what they were asked and hand out ids in order. */
function writes(): InboxWrites & { added: string[]; removed: string[] } {
  const added: string[] = [];
  const removed: string[] = [];
  return {
    added,
    removed,
    addTrip: vi.fn(async () => 'v-new'),
    addItem: vi.fn(async (input) => {
      added.push(input.title);
      return `i${added.length}`;
    }),
    removeStaged: vi.fn(async (id: string) => {
      removed.push(id);
    }),
  };
}

describe('tripItemFrom', () => {
  it('keeps the capitals of a title, and only what its class carries', () => {
    const item = tripItemFrom(GROUP.items[1], 'v1');
    expect(item.title).toBe('Hotel Cormorán');
    expect(item.trip_id).toBe('v1');
    expect(item.kind).toBe('lodging');
    expect(item.done).toBe(false);
    // A stay has days and no hours, and no airports.
    expect(item.on_date).toBe('2026-09-12');
    expect(item.ends_on).toBe('2026-09-19');
    expect(item.at_time).toBeNull();
    expect(item.ends_at).toBeNull();
    expect(item.from_code).toBeNull();
    const booking = tripItemFrom(GROUP.items[2], 'v1');
    expect(booking.at_time).toBe('08:40');
    expect(booking.ends_on).toBeNull();
    const ticket = tripItemFrom(GROUP.items[0], 'v1');
    expect(ticket.from_code).toBe('AEP');
    expect(ticket.ends_at).toBe('11:05');
  });
});

describe('confirmInbox', () => {
  it('writes the rows into the chosen trip in the group order, then clears the staged ones', async () => {
    const w = writes();
    const undo = await confirmInbox(GROUP, 'v1', w);
    expect(w.addTrip).not.toHaveBeenCalled();
    expect(w.added).toEqual(['AR 1420', 'Hotel Cormorán', 'Autos Pampa · alquiler de auto']);
    expect(vi.mocked(w.addItem).mock.calls.every(([input]) => input.trip_id === 'v1')).toBe(true);
    expect(w.removed).toEqual(['s1', 's2', 's3']);
    expect(undo).toEqual({
      label: 'Se agregaron 3 ítems',
      tripCreated: false,
      tripId: 'v1',
      itemIds: ['i1', 'i2', 'i3'],
      staged: GROUP.items,
    });
  });

  it('creates the trip first, named as the model named it and without dates', async () => {
    const w = writes();
    const undo = await confirmInbox(GROUP, CREATE_TRIP_CHOICE, w);
    expect(w.addTrip).toHaveBeenCalledWith({ title: 'Bariloche', starts_on: null, ends_on: null });
    expect(vi.mocked(w.addItem).mock.calls.every(([input]) => input.trip_id === 'v-new')).toBe(
      true,
    );
    expect(undo?.tripCreated).toBe(true);
    expect(undo?.tripId).toBe('v-new');
  });

  it('writes nothing when the trip could not be created', async () => {
    const w = writes();
    vi.mocked(w.addTrip).mockResolvedValueOnce(undefined);
    expect(await confirmInbox(GROUP, CREATE_TRIP_CHOICE, w)).toBeUndefined();
    expect(w.added).toEqual([]);
    expect(w.removed).toEqual([]);
  });

  it('says one item in the singular', async () => {
    const w = writes();
    const undo = await confirmInbox({ ...GROUP, items: [GROUP.items[0]] }, 'v1', w);
    expect(undo?.label).toBe('Se agregó 1 ítem');
  });
});

describe('discardInbox', () => {
  it('clears the staged rows and creates nothing', async () => {
    const w = writes();
    await discardInbox(GROUP, w);
    expect(w.removed).toEqual(['s1', 's2', 's3']);
    expect(w.added).toEqual([]);
    expect(w.addTrip).not.toHaveBeenCalled();
  });
});
