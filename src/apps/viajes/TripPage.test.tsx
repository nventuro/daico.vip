import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Trip, TripItem, TripKind } from '../../lib/offline/specs';

const TRIP: Trip = {
  id: 'v1',
  title: 'japón',
  starts_on: '2026-09-12',
  ends_on: '2026-09-26',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

function item(id: string, kind: TripKind, done = false): TripItem {
  return {
    id,
    trip_id: TRIP.id,
    kind,
    title: `${id} de prueba`,
    on_date: null,
    at_time: null,
    ends_on: null,
    ends_at: null,
    from_code: null,
    to_code: null,
    done,
    comments: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

// What the store gives back, set per test before the page is rendered.
const state: { items: TripItem[] } = { items: [] };

vi.mock('./useTrips', () => ({
  useTrips: () => ({ items: [TRIP], loading: false, error: null }),
}));
vi.mock('./useTripItems', () => ({
  useTripItems: () => ({ items: state.items, loading: false, error: null, save: vi.fn() }),
}));
vi.mock('../../hooks/useAttachments', () => ({
  useAttachments: () => ({ items: [], loading: false, error: null }),
  ownersWithAttachments: () => new Set<string>(),
}));

function render() {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[`/viajes/${TRIP.id}`]}>
      <Routes>
        <Route path="/viajes/:tripId" element={<TripPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Where each of the given words first appears, so the order can be read off. */
function positions(html: string, words: string[]): number[] {
  return words.map((word) => html.indexOf(word));
}

const { default: TripPage } = await import('./TripPage');

describe('TripPage', () => {
  it('draws the classes it has, in their fixed order, and nothing else', () => {
    state.items = [
      item('lugar', 'place'),
      item('reserva', 'booking'),
      item('pendiente', 'todo'),
      item('pasaje', 'ticket'),
    ];
    const html = render();
    const [todo, ticket, booking, place] = positions(html, [
      'Pendientes',
      'Pasajes',
      'Reservas',
      'Lugares',
    ]);
    expect(todo).toBeGreaterThan(-1);
    expect(todo).toBeLessThan(ticket);
    expect(ticket).toBeLessThan(booking);
    expect(booking).toBeLessThan(place);
    // Nothing was booked to sleep in, so the section is not drawn at all.
    expect(html).not.toContain('Alojamiento');
  });

  it('leaves the ticked pendientes out of the list, under Hechos', () => {
    state.items = [item('pendiente', 'todo'), item('hecho', 'todo', true)];
    const html = render();
    expect(html).toContain('pendiente de prueba');
    expect(html).toContain('Hechos');
    // The section is collapsed, so what is done is out of the way, not gone.
    expect(html).not.toContain('hecho de prueba');
  });

  it('lets the bookings rise once the last pendiente is ticked', () => {
    state.items = [item('hecho', 'todo', true), item('pasaje', 'ticket')];
    const html = render();
    expect(html).not.toContain('Pendientes');
    expect(html).toContain('Pasajes');
  });

  it('says the trip is empty before anything is on it', () => {
    state.items = [];
    expect(render()).toContain('Todavía no hay nada en este viaje');
  });
});
