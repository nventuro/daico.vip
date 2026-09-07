import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Attachment, TripItem, TripKind } from '../../lib/offline/specs';
import type { AttachmentOwnerKind } from '../../types';
import { addDays, todayIso } from '../../utils/dateUtils';

const TODAY = todayIso();

function item(id: string, kind: TripKind, overrides: Partial<TripItem> = {}): TripItem {
  return {
    id,
    trip_id: 'v1',
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

/** A flight leaving `days` from today, between two airports. */
function flight(id: string, days: number, overrides: Partial<TripItem> = {}): TripItem {
  return item(id, 'ticket', {
    on_date: addDays(TODAY, days),
    at_time: '08:40',
    from_code: 'AEP',
    to_code: 'BRC',
    ...overrides,
  });
}

/** A file of `kind` on the row `ownerId`. */
function file(kind: AttachmentOwnerKind, ownerId: string): Attachment {
  return {
    id: `${kind}-${ownerId}`,
    owner_kind: kind,
    owner_id: ownerId,
    name: '',
    mime: 'image/png',
    size: 1,
    wrapped_file_key: 'k',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

const state: { items: TripItem[]; attachments: Attachment[] } = { items: [], attachments: [] };

vi.mock('./useTripItems', () => ({
  useTripItems: () => ({ items: state.items, loading: false, error: null }),
}));
vi.mock('../../hooks/useAttachments', () => ({
  useAttachments: () => ({ items: state.attachments, loading: false, error: null }),
  ownersWithAttachments: (attachments: Attachment[], kind: AttachmentOwnerKind) =>
    new Set(attachments.filter((a) => a.owner_kind === kind).map((a) => a.owner_id)),
}));

const { useTripsUpcoming } = await import('./useTripsUpcoming');

/** The hook's answer, read out of a render of nothing else. */
function upcoming(): string[] {
  const titles: string[] = [];
  function Probe() {
    for (const entry of useTripsUpcoming() ?? []) titles.push(`${entry.title} ${entry.to}`);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return titles;
}

describe('useTripsUpcoming', () => {
  it('takes only the pendientes that are dated and still open', () => {
    state.attachments = [];
    state.items = [
      item('cerca', 'todo', { on_date: addDays(TODAY, 3) }),
      item('sin fecha', 'todo'),
      item('hecho', 'todo', { on_date: addDays(TODAY, 3), done: true }),
      item('lejos', 'todo', { on_date: addDays(TODAY, 30) }),
    ];
    expect(upcoming()).toEqual(['cerca /viajes/v1/cerca']);
  });

  it('takes one already past, which is exactly when it needs attention', () => {
    state.attachments = [];
    state.items = [item('vencido', 'todo', { on_date: addDays(TODAY, -2) })];
    expect(upcoming()).toEqual(['vencido /viajes/v1/vencido']);
  });

  it('never takes anything already booked, however soon it is — save a flight without its boarding pass', () => {
    state.attachments = [];
    state.items = [
      item('pasaje', 'ticket', { on_date: addDays(TODAY, 1) }),
      item('alojamiento', 'lodging', { on_date: addDays(TODAY, 1) }),
      item('reserva', 'booking', { on_date: addDays(TODAY, 1) }),
      item('lugar', 'place'),
    ];
    expect(upcoming()).toEqual([]);
  });

  it('asks for a boarding pass from the day before a flight until it has left, and never for a bus', () => {
    state.attachments = [];
    state.items = [
      flight('mañana', 1),
      flight('hoy', 0),
      flight('pasado mañana', 2),
      flight('ayer', -1),
      // A ticket with no airports is a bus: nothing to check in for.
      item('micro', 'ticket', { on_date: addDays(TODAY, 1) }),
      flight('sin día', 1, { on_date: null }),
    ];
    expect(upcoming()).toEqual([
      'boarding pass · mañana /viajes/v1/mañana',
      'boarding pass · hoy /viajes/v1/hoy',
    ]);
  });

  it('stops asking with the first boarding pass on the flight, and only a boarding pass', () => {
    state.items = [flight('con pase', 1), flight('con e-ticket', 1)];
    state.attachments = [file('boarding_pass', 'con pase'), file('trip_item', 'con e-ticket')];
    expect(upcoming()).toEqual(['boarding pass · con e-ticket /viajes/v1/con e-ticket']);
  });

  it("marks a pendiente that has files of either kind, as the trip's list does", () => {
    state.items = [item('con archivo', 'todo', { on_date: TODAY })];
    state.attachments = [file('boarding_pass', 'con archivo')];
    const marks: string[] = [];
    function Probe() {
      for (const entry of useTripsUpcoming() ?? []) marks.push(...(entry.marks ?? []));
      return null;
    }
    renderToStaticMarkup(<Probe />);
    expect(marks).toEqual(['comments']);
  });
});
