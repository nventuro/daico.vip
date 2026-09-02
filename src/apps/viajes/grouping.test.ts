import { describe, it, expect } from 'vitest';
import type { Trip, TripInboxItem, TripItem, TripKind } from '../../lib/offline/specs';
import {
  CREATE_TRIP_CHOICE,
  inboxGroups,
  inboxTripChoices,
  pendingCounts,
  splitTrips,
  suggestedTripChoice,
  tripSections,
} from './grouping';

const TODAY = '2026-09-10';

function item(id: string, kind: TripKind, overrides: Partial<TripItem> = {}): TripItem {
  return {
    id,
    trip_id: 'v',
    kind,
    title: id,
    on_date: null,
    at_time: null,
    ends_on: null,
    ends_at: null,
    from_code: null,
    to_code: null,
    done: false,
    comments: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function trip(id: string, starts_on: string | null, ends_on: string | null = null): Trip {
  return {
    id,
    title: id,
    starts_on,
    ends_on,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

describe('tripSections', () => {
  it('draws the classes in their fixed order, whatever order the rows are in', () => {
    const rows = [item('a', 'place'), item('b', 'todo'), item('c', 'lodging'), item('d', 'ticket')];
    const { sections } = tripSections(rows);
    expect(sections.map((section) => section.kind)).toEqual(['todo', 'ticket', 'lodging', 'place']);
  });

  it('leaves out the classes the trip has nothing of', () => {
    const { sections } = tripSections([item('a', 'booking')]);
    expect(sections.map((section) => section.label)).toEqual(['Reservas']);
  });

  it('takes a ticked pendiente out of its section and into the done ones', () => {
    const open = item('a', 'todo');
    const ticked = item('b', 'todo', { done: true });
    const { sections, done } = tripSections([open, ticked]);
    expect(sections).toEqual([{ kind: 'todo', label: 'Pendientes', items: [open] }]);
    expect(done).toEqual([ticked]);
  });

  it('drops the pendientes section once the last one is ticked, so the bookings rise', () => {
    const { sections, done } = tripSections([
      item('a', 'todo', { done: true }),
      item('b', 'ticket'),
    ]);
    expect(sections.map((section) => section.kind)).toEqual(['ticket']);
    expect(done.map((row) => row.id)).toEqual(['a']);
  });
});

describe('splitTrips', () => {
  it('handles empty input', () => {
    expect(splitTrips([], TODAY)).toEqual({ upcoming: [], undated: [], past: [] });
  });

  it('keeps a trip already under way among the upcoming ones, by its last day', () => {
    const running = trip('running', '2026-09-05', '2026-09-12');
    expect(splitTrips([running], TODAY).upcoming).toEqual([running]);
  });

  it('splits by dates and lists the past most recent first', () => {
    const soon = trip('soon', '2026-10-01', '2026-10-10');
    const someday = trip('someday', null);
    const old = trip('old', '2026-02-01', '2026-02-10');
    const older = trip('older', '2025-05-01', '2025-05-10');
    const { upcoming, undated, past } = splitTrips([older, old, soon, someday], TODAY);
    expect(upcoming.map((t) => t.id)).toEqual(['soon']);
    expect(undated.map((t) => t.id)).toEqual(['someday']);
    expect(past.map((t) => t.id)).toEqual(['old', 'older']);
  });

  it('takes a one-day trip as over the day after it', () => {
    expect(splitTrips([trip('a', '2026-09-10')], TODAY).upcoming).toHaveLength(1);
    expect(splitTrips([trip('a', '2026-09-09')], TODAY).past).toHaveLength(1);
  });
});

describe('pendingCounts', () => {
  it('counts only the open pendientes, by trip', () => {
    const rows = [
      item('a', 'todo', { trip_id: 'v1' }),
      item('b', 'todo', { trip_id: 'v1' }),
      item('c', 'todo', { trip_id: 'v1', done: true }),
      item('d', 'ticket', { trip_id: 'v1' }),
      item('e', 'todo', { trip_id: 'v2' }),
    ];
    expect([...pendingCounts(rows)]).toEqual([
      ['v1', 2],
      ['v2', 1],
    ]);
  });
});

function staged(id: string, overrides: Partial<TripInboxItem> = {}): TripInboxItem {
  return {
    id,
    import_id: 'e1',
    email_subject: 'Fwd: Tu vuelo',
    trip_title: 'Bariloche',
    kind: 'ticket',
    title: id,
    on_date: null,
    at_time: null,
    ends_on: null,
    ends_at: null,
    from_code: null,
    to_code: null,
    comments: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    ...overrides,
  };
}

describe('inboxGroups', () => {
  it('lists a group by class, then by day with the undated last, then by title', () => {
    const rows = [
      staged('excursión', { kind: 'booking', on_date: '2026-09-15' }),
      staged('vuelta', { kind: 'ticket', on_date: '2026-09-19' }),
      staged('hotel', { kind: 'lodging', on_date: '2026-09-12' }),
      staged('sin fecha', { kind: 'ticket' }),
      staged('ida', { kind: 'ticket', on_date: '2026-09-12' }),
      staged('auto', { kind: 'booking', on_date: '2026-09-12' }),
      staged('bus', { kind: 'ticket', on_date: '2026-09-12' }),
    ];
    const [group] = inboxGroups(rows);
    expect(group.items.map((item) => item.title)).toEqual([
      'bus',
      'ida',
      'vuelta',
      'sin fecha',
      'hotel',
      'auto',
      'excursión',
    ]);
  });

  it('puts the email that came last first, and dates a group by its earliest row', () => {
    const groups = inboxGroups([
      staged('a', { import_id: 'old', created_at: '2026-09-01T10:00:00Z' }),
      staged('b', { import_id: 'new', created_at: '2026-09-02T10:00:00.500Z' }),
      staged('c', { import_id: 'new', created_at: '2026-09-02T10:00:00+00:00' }),
      staged('d', { import_id: 'old', created_at: '2026-09-01T09:00:00Z' }),
    ]);
    expect(groups.map((group) => group.importId)).toEqual(['new', 'old']);
    expect(groups[0].receivedAt).toBe('2026-09-02T10:00:00+00:00');
    expect(groups[1].receivedAt).toBe('2026-09-01T09:00:00Z');
    expect(groups[0].tripTitle).toBe('Bariloche');
    expect(groups[0].emailSubject).toBe('Fwd: Tu vuelo');
  });

  it('makes nothing of nothing', () => {
    expect(inboxGroups([])).toEqual([]);
  });
});

describe('inboxTripChoices', () => {
  // In the spec's order: by start, the undated last.
  const trips = [
    trip('pasado', '2026-08-01', '2026-08-10'),
    trip('en curso', '2026-09-08', '2026-09-12'),
    trip('próximo', '2026-09-20'),
    trip('lejano', '2026-12-01', '2026-12-15'),
    trip('sin fechas', null),
  ];

  it('offers the next trip first, the furthest after, the undated last, and never a past one', () => {
    expect(inboxTripChoices(trips, TODAY).map((t) => t.id)).toEqual([
      'en curso',
      'próximo',
      'lejano',
      'sin fechas',
    ]);
  });

  it('suggests the next trip, and creating one when only past trips exist', () => {
    expect(suggestedTripChoice(inboxTripChoices(trips, TODAY))).toBe('en curso');
    expect(suggestedTripChoice(inboxTripChoices([trips[0]], TODAY))).toBe(CREATE_TRIP_CHOICE);
    expect(suggestedTripChoice(inboxTripChoices([], TODAY))).toBe(CREATE_TRIP_CHOICE);
  });
});
