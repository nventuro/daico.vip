import { describe, it, expect, vi } from 'vitest';
import type { TripInboxItem } from '../../lib/offline/specs';
import type { InboxGroup } from './grouping';
import { CREATE_TRIP_CHOICE } from './grouping';
import type { AttachmentSource } from '../../hooks/useAttachments';
import type { AttachmentOwner } from '../../types';
import {
  confirmBoardingPass,
  confirmInbox,
  discardInbox,
  groupFileIds,
  tripItemFrom,
  type InboxWrites,
  type TripItemWrite,
} from './inboxConfirm';

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
    file_ids: '[]',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    ...overrides,
  };
}

const GROUP: InboxGroup = {
  key: 'e1',
  importId: 'e1',
  boardingPass: false,
  tripTitle: 'Bariloche',
  emailSubject: 'Fwd: Tu vuelo',
  receivedAt: '2026-09-01T10:00:00Z',
  items: [
    staged('s1'),
    staged('s2', { kind: 'lodging', title: 'Hotel Cormorán ', ends_on: '2026-09-19' }),
    staged('s3', { kind: 'booking', title: 'Autos Pampa · alquiler de auto' }),
  ],
};

/** A staged file as the confirm gets it, opened. */
function opened(name: string): AttachmentSource {
  return { name, mime: 'application/pdf', size: 3, plain: new Uint8Array([1, 2, 3]) };
}

/** Writes that remember what they were asked and hand out ids in order. */
function writes(): InboxWrites & {
  added: string[];
  attached: [string, string][];
  removed: string[];
  files: string[][];
} {
  const added: string[] = [];
  const attached: [string, string][] = [];
  const removed: string[] = [];
  const files: string[][] = [];
  return {
    added,
    attached,
    removed,
    files,
    addTrip: vi.fn(() => Promise.resolve('v-new')),
    addItem: vi.fn((input: TripItemWrite) => {
      added.push(input.title);
      return Promise.resolve(`i${added.length}`);
    }),
    addAttachment: vi.fn((owner: AttachmentOwner, file: AttachmentSource) => {
      attached.push([owner.id, file.name]);
      return Promise.resolve(`a${attached.length}`);
    }),
    removeStaged: vi.fn((id: string) => {
      removed.push(id);
      return Promise.resolve();
    }),
    removeFiles: vi.fn((ids: string[]) => {
      files.push(ids);
      return Promise.resolve();
    }),
  };
}

/** One flight's boarding pass, staged on its own, with the files it is. */
const PASS: InboxGroup = {
  key: 'p1',
  importId: 'e2',
  boardingPass: true,
  tripTitle: 'Bariloche',
  emailSubject: 'Tu boarding pass',
  receivedAt: '2026-09-11T10:00:00Z',
  items: [
    staged('p1', {
      import_id: 'e2',
      kind: 'boarding_pass',
      comments: 'Ana 14A · Bruno 14B',
      file_ids: '["f1", "f2"]',
    }),
  ],
};

/** The two passes, opened. */
const PASS_FILES = new Map([
  ['f1', opened('ana')],
  ['f2', opened('bruno')],
]);

describe('tripItemFrom', () => {
  it('makes a boarding pass the pasaje it is for', () => {
    const flight = tripItemFrom(PASS.items[0], 'v1');
    expect(flight.kind).toBe('ticket');
    expect(flight.title).toBe('AR 1420');
    expect(flight.from_code).toBe('AEP');
    expect(flight.at_time).toBe('08:40');
    expect(flight.ends_at).toBe('11:05');
  });

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
  it('writes the rows into the chosen trip in the group order, each staged row cleared once its own is in', async () => {
    const w = writes();
    const order: string[] = [];
    vi.mocked(w.addItem).mockImplementation((input) => {
      w.added.push(input.title);
      order.push(`add ${input.title}`);
      return Promise.resolve(`i${w.added.length}`);
    });
    vi.mocked(w.removeStaged).mockImplementation((id) => {
      order.push(`remove ${id}`);
      w.removed.push(id);
      return Promise.resolve();
    });
    const undo = await confirmInbox(GROUP, 'v1', w);
    expect(w.addTrip).not.toHaveBeenCalled();
    expect(order).toEqual([
      'add AR 1420',
      'remove s1',
      'add Hotel Cormorán',
      'remove s2',
      'add Autos Pampa · alquiler de auto',
      'remove s3',
    ]);
    expect(vi.mocked(w.addItem).mock.calls.every(([input]) => input.trip_id === 'v1')).toBe(true);
    expect(undo).toEqual({
      label: 'Se agregaron 3 ítems',
      tripCreated: false,
      tripId: 'v1',
      itemId: null,
      itemIds: ['i1', 'i2', 'i3'],
      attachmentIds: [],
      staged: GROUP.items,
      fileIds: [],
    });
  });

  it('attaches to each row the files it was printed in, a file on two rows to each, and leaves the staged files where they are', async () => {
    const group: InboxGroup = {
      ...GROUP,
      items: [
        staged('s1', { file_ids: '["f1"]' }),
        staged('s2', { kind: 'lodging', title: 'Hotel Cormorán', file_ids: '["f1", "f2"]' }),
        staged('s3', { kind: 'booking', title: 'Autos Pampa' }),
      ],
    };
    expect(groupFileIds(group)).toEqual(['f1', 'f2']);
    const w = writes();
    const files = new Map([
      ['f1', opened('pasajes')],
      ['f2', opened('hotel')],
    ]);
    const undo = await confirmInbox(group, 'v1', w, files);
    expect(w.attached).toEqual([
      ['i1', 'pasajes'],
      ['i2', 'pasajes'],
      ['i2', 'hotel'],
    ]);
    expect(undo?.attachmentIds).toEqual(['a1', 'a2', 'a3']);
    expect(undo?.fileIds).toEqual(['f1', 'f2']);
    expect(w.files).toEqual([]);
  });

  it('skips a file it was not given, and writes the row all the same', async () => {
    const group: InboxGroup = { ...GROUP, items: [staged('s1', { file_ids: '["f1"]' })] };
    const w = writes();
    const undo = await confirmInbox(group, 'v1', w);
    expect(w.attached).toEqual([]);
    expect(undo?.itemIds).toEqual(['i1']);
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

  it('stops at a row it could not write, leaving it and the rest staged', async () => {
    const w = writes();
    vi.mocked(w.addItem).mockImplementationOnce((input) => {
      w.added.push(input.title);
      return Promise.resolve('i1');
    });
    vi.mocked(w.addItem).mockResolvedValueOnce(undefined);
    const undo = await confirmInbox(GROUP, 'v1', w);
    // The first row is in the trip and its staged row gone; the second could
    // not be written, so it and the third are left to be confirmed again.
    expect(w.removed).toEqual(['s1']);
    expect(w.addItem).toHaveBeenCalledTimes(2);
    expect(undo).toMatchObject({ itemIds: ['i1'], staged: [GROUP.items[0]] });
  });

  it('stops before clearing a row whose file could not be attached', async () => {
    const group: InboxGroup = {
      ...GROUP,
      items: [staged('s1', { file_ids: '["f1"]' }), staged('s2')],
    };
    const w = writes();
    vi.mocked(w.addAttachment).mockResolvedValueOnce(undefined);
    const undo = await confirmInbox(group, 'v1', w, new Map([['f1', opened('pasajes')]]));
    // The row is in the trip without its PDF, and stays staged with it, to
    // be confirmed again rather than lose the PDF.
    expect(w.removed).toEqual([]);
    expect(w.addItem).toHaveBeenCalledTimes(1);
    expect(undo).toMatchObject({ itemIds: ['i1'], attachmentIds: [], staged: [] });
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

describe('confirmBoardingPass', () => {
  it('puts every file on the chosen pasaje, under the boarding-pass kind, and clears the row', async () => {
    const w = writes();
    const undo = await confirmBoardingPass(
      PASS,
      { kind: 'flight', tripId: 'v1', flightId: 'i9' },
      w,
      PASS_FILES,
    );
    expect(w.addItem).not.toHaveBeenCalled();
    expect(w.addTrip).not.toHaveBeenCalled();
    expect(vi.mocked(w.addAttachment).mock.calls.map(([owner]) => owner)).toEqual([
      { kind: 'boarding_pass', id: 'i9' },
      { kind: 'boarding_pass', id: 'i9' },
    ]);
    expect(w.attached).toEqual([
      ['i9', 'ana'],
      ['i9', 'bruno'],
    ]);
    expect(w.removed).toEqual(['p1']);
    expect(undo).toEqual({
      label: 'Se agregaron 2 boarding pass',
      tripCreated: false,
      tripId: 'v1',
      itemId: 'i9',
      itemIds: [],
      attachmentIds: ['a1', 'a2'],
      staged: PASS.items,
      fileIds: ['f1', 'f2'],
    });
  });

  it('makes the pasaje in the chosen trip first when there is none, and lands on it', async () => {
    const w = writes();
    const undo = await confirmBoardingPass(
      PASS,
      { kind: 'new-flight', tripId: 'v1' },
      w,
      PASS_FILES,
    );
    expect(vi.mocked(w.addItem).mock.calls[0][0]).toMatchObject({
      kind: 'ticket',
      title: 'AR 1420',
      trip_id: 'v1',
    });
    expect(w.attached).toEqual([
      ['i1', 'ana'],
      ['i1', 'bruno'],
    ]);
    expect(undo).toMatchObject({ tripCreated: false, tripId: 'v1', itemId: 'i1', itemIds: ['i1'] });
  });

  it('makes the trip and the pasaje when there is neither', async () => {
    const w = writes();
    const undo = await confirmBoardingPass(PASS, { kind: 'new-trip' }, w, PASS_FILES);
    expect(w.addTrip).toHaveBeenCalledWith({ title: 'Bariloche', starts_on: null, ends_on: null });
    expect(vi.mocked(w.addItem).mock.calls[0][0].trip_id).toBe('v-new');
    expect(undo).toMatchObject({
      tripCreated: true,
      tripId: 'v-new',
      itemId: 'i1',
      itemIds: ['i1'],
    });
    expect(w.removed).toEqual(['p1']);
  });

  it('leaves the row staged when a file is not here or could not be attached', async () => {
    const short = writes();
    const kept = await confirmBoardingPass(
      PASS,
      { kind: 'flight', tripId: 'v1', flightId: 'i9' },
      short,
      new Map([['f1', opened('ana')]]),
    );
    expect(short.attached).toEqual([['i9', 'ana']]);
    expect(short.removed).toEqual([]);
    expect(kept).toMatchObject({ attachmentIds: ['a1'], staged: [], itemId: 'i9' });

    const refused = writes();
    vi.mocked(refused.addAttachment).mockResolvedValueOnce(undefined);
    await confirmBoardingPass(
      PASS,
      { kind: 'flight', tripId: 'v1', flightId: 'i9' },
      refused,
      PASS_FILES,
    );
    expect(refused.removed).toEqual([]);
  });

  it('writes nothing when the trip could not be created, and says one in the singular', async () => {
    const w = writes();
    vi.mocked(w.addTrip).mockResolvedValueOnce(undefined);
    expect(await confirmBoardingPass(PASS, { kind: 'new-trip' }, w, PASS_FILES)).toBeUndefined();
    expect(w.attached).toEqual([]);
    const one = writes();
    const undo = await confirmBoardingPass(
      { ...PASS, items: [{ ...PASS.items[0], file_ids: '["f1"]' }] },
      { kind: 'flight', tripId: 'v1', flightId: 'i9' },
      one,
      PASS_FILES,
    );
    expect(undo?.label).toBe('Se agregó 1 boarding pass');
  });
});

describe('discardInbox', () => {
  it('clears the staged rows and their files, and creates nothing', async () => {
    const group: InboxGroup = {
      ...GROUP,
      items: [staged('s1', { file_ids: '["f1"]' }), staged('s2', { file_ids: '["f1", "f2"]' })],
    };
    const w = writes();
    await discardInbox(group, w);
    expect(w.removed).toEqual(['s1', 's2']);
    expect(w.files).toEqual([['f1', 'f2']]);
    expect(w.added).toEqual([]);
    expect(w.addTrip).not.toHaveBeenCalled();
  });
});
