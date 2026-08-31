import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { TripItem, TripKind } from '../../lib/offline/specs';
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

const state: { items: TripItem[] } = { items: [] };

vi.mock('./useTripItems', () => ({
  useTripItems: () => ({ items: state.items, loading: false, error: null }),
}));
vi.mock('../../hooks/useAttachments', () => ({
  useAttachments: () => ({ items: [], loading: false, error: null }),
  ownersWithAttachments: () => new Set<string>(),
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
    state.items = [
      item('cerca', 'todo', { on_date: addDays(TODAY, 3) }),
      item('sin fecha', 'todo'),
      item('hecho', 'todo', { on_date: addDays(TODAY, 3), done: true }),
      item('lejos', 'todo', { on_date: addDays(TODAY, 30) }),
    ];
    expect(upcoming()).toEqual(['cerca /viajes/v1/cerca']);
  });

  it('takes one already past, which is exactly when it needs attention', () => {
    state.items = [item('vencido', 'todo', { on_date: addDays(TODAY, -2) })];
    expect(upcoming()).toEqual(['vencido /viajes/v1/vencido']);
  });

  it('never takes anything already booked, however soon it is', () => {
    state.items = [
      item('pasaje', 'ticket', { on_date: addDays(TODAY, 1) }),
      item('alojamiento', 'lodging', { on_date: addDays(TODAY, 1) }),
      item('reserva', 'booking', { on_date: addDays(TODAY, 1) }),
      item('lugar', 'place'),
    ];
    expect(upcoming()).toEqual([]);
  });
});
