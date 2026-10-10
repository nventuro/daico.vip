import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Trip, TripItem } from '../../lib/offline/specs';

const TRIP: Trip = {
  id: 'v1',
  title: 'Japón',
  starts_on: '2026-09-12',
  ends_on: '2026-09-26',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const ITEM: TripItem = {
  id: 'i1',
  trip_id: TRIP.id,
  kind: 'todo',
  title: 'sacar el seguro',
  on_date: null,
  at_time: null,
  ends_on: null,
  ends_at: null,
  transport: null,
  origin: null,
  destination: null,
  carry_on_bags: null,
  checked_bags: null,
  done: false,
  comments: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// What the store gives back, set per test before the page is rendered.
const state: { trips: Trip[] } = { trips: [] };

vi.mock('./useTrips', () => ({
  useTrips: () => ({ items: state.trips, loading: false, error: null }),
}));
vi.mock('./useTripItems', () => ({
  useTripItems: () => ({
    items: [ITEM],
    loading: false,
    error: null,
    save: vi.fn(),
    setDone: vi.fn(),
    remove: vi.fn(),
  }),
}));
vi.mock('./useInboxUndo', () => ({ useInboxUndoArrival: () => {} }));
vi.mock('../../hooks/useAttachments', () => ({
  useAttachments: () => ({ items: [], loading: false, error: null, removeAll: vi.fn() }),
}));
// The page's head is what is under test; its files and its comments bring in
// the key and the editor.
vi.mock('../../components/AttachmentGrid', () => ({ default: () => null }));
vi.mock('../../components/Comments', () => ({ default: () => null }));

function render() {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[`/viajes/${TRIP.id}/${ITEM.id}`]}>
      <Routes>
        <Route path="/viajes/:tripId/:itemId" element={<ItemPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const { default: ItemPage } = await import('./ItemPage');

describe('ItemPage', () => {
  it('names the trip the row is in, beside its class, on a chip that leads to it', () => {
    state.trips = [TRIP];
    const html = render();
    expect(html).toMatch(/<a [^>]*href="\/viajes\/v1"[^>]*><span[^>]*>Japón<\/span>/);
    expect(html.indexOf('>Pendiente<')).toBeGreaterThan(-1);
    expect(html.indexOf('>Pendiente<')).toBeLessThan(html.indexOf('>Japón<'));
  });

  it('draws the row without the chip while its trip is not on the device', () => {
    state.trips = [];
    const html = render();
    expect(html).toContain('>Pendiente<');
    expect(html).not.toContain('href="/viajes/v1"');
  });
});
