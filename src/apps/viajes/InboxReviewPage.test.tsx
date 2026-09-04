import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Trip, TripInboxItem } from '../../lib/offline/specs';
import { todayIso } from '../../utils/dateUtils';
import { inboxGroups } from './grouping';

/** A day `days` from today, yyyy-mm-dd. */
function fromToday(days: number): string {
  const [year, month, day] = todayIso().split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
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

function staged(id: string, overrides: Partial<TripInboxItem> = {}): TripInboxItem {
  return {
    id,
    import_id: 'e1',
    email_subject: 'Fwd: Tu vuelo',
    trip_title: 'Bariloche',
    kind: 'ticket',
    title: 'AR 1420',
    on_date: fromToday(10),
    at_time: '08:40',
    ends_on: fromToday(10),
    ends_at: '11:05',
    from_code: 'AEP',
    to_code: 'BRC',
    comments: 'Código QK7T2M',
    file_ids: '[]',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// What the stores give back, set per test before the page is rendered.
const state: { trips: Trip[]; staged: TripInboxItem[]; missing: string[]; online: boolean } = {
  trips: [],
  staged: [],
  missing: [],
  online: true,
};

vi.mock('./useTrips', () => ({
  useTrips: () => ({ items: state.trips, loading: false, error: null, add: vi.fn() }),
}));
vi.mock('./useTripInbox', () => ({
  useTripInbox: () => ({
    groups: inboxGroups(state.staged),
    loading: false,
    error: null,
    insert: vi.fn(),
    remove: vi.fn(),
  }),
}));
vi.mock('../../hooks/useOfflineTable', () => ({
  useOfflineTable: () => ({
    items: [],
    loading: false,
    error: null,
    insert: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }),
}));
vi.mock('../../hooks/useAttachments', () => ({
  useAttachments: () => ({ items: [], loading: false, error: null, addSealed: vi.fn() }),
}));
vi.mock('../../hooks/useMasterKey', () => ({
  useMasterKey: () => ({ status: 'unlocked', key: {} }),
}));
vi.mock('../../hooks/useOnline', () => ({
  useOnline: () => state.online,
}));
vi.mock('./useMissingInboxFiles', () => ({
  useMissingInboxFiles: () => state.missing,
}));

function render(importId = 'e1') {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[`/viajes/inbox/${importId}`]}>
      <Routes>
        <Route path="/viajes/inbox/:importId" element={<InboxReviewPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const { default: InboxReviewPage } = await import('./InboxReviewPage');

describe('InboxReviewPage', () => {
  const rows = [
    staged('s1'),
    staged('s2', { kind: 'lodging', title: 'Hotel Cormorán', ends_on: fromToday(17) }),
    staged('s3', { kind: 'booking', title: 'Autos Pampa · alquiler de auto', comments: null }),
  ];

  beforeEach(() => {
    state.missing = [];
    state.online = true;
  });

  it('shows the group whole: its name, its source, what arrived as it came, and the two ways out', () => {
    state.trips = [];
    state.staged = rows;
    const html = render();
    expect(html).toContain('Bariloche');
    expect(html).toContain('Fuente: «Fwd: Tu vuelo»');
    expect(html).toContain('Qué llegó');
    expect(html).toContain('3 ítems');
    expect(html).toContain('AR 1420');
    expect(html).toContain('Hotel Cormorán');
    expect(html).toContain('Código QK7T2M');
    expect(html).toContain('Agregar 3 ítems');
    expect(html).toContain('Descartar');
    // Rows are not links: nothing here opens on its own.
    expect(html).not.toContain('href="/viajes/e1');
  });

  it('starts on the next trip, past trips left out, and creating one last', () => {
    state.trips = [
      trip('pasado', fromToday(-20), fromToday(-10)),
      trip('próximo', fromToday(5), fromToday(12)),
      trip('lejano', fromToday(60)),
      trip('sin fechas', null),
    ];
    state.staged = rows;
    const html = render();
    expect(html).toContain('<option value="próximo" selected="">');
    expect(html).not.toContain('value="pasado"');
    expect(html).toContain('sin fechas · sin fechas');
    const options = [...html.matchAll(/<option[^>]*value="([^"]+)"/g)].map((m) => m[1]);
    expect(options).toEqual(['próximo', 'lejano', 'sin fechas', 'create']);
    expect(html).toContain('Crear viaje «Bariloche»');
  });

  it('starts on creating the trip when nothing is ahead', () => {
    state.trips = [trip('pasado', fromToday(-20), fromToday(-10))];
    state.staged = rows;
    expect(render()).toContain('<option value="create" selected="">');
  });

  it('says one item in the singular', () => {
    state.trips = [];
    state.staged = [rows[0]];
    const html = render();
    expect(html).toContain('1 ítem<');
    expect(html).toContain('Agregar 1 ítem');
  });

  it('says when the group is no longer there', () => {
    state.trips = [];
    state.staged = rows;
    expect(render('gone')).toContain('No se encontró en el inbox.');
  });

  it('marks the rows that came with a PDF, and those alone', () => {
    state.trips = [];
    state.staged = [staged('s1', { file_ids: '["f1"]' }), staged('s2', { title: 'Sin PDF' })];
    const html = render();
    expect(html.match(/Tiene comentarios o adjuntos/g)).toHaveLength(1);
    expect(html.indexOf('Tiene comentarios o adjuntos')).toBeLessThan(html.indexOf('Sin PDF'));
  });

  it('carries the line while the PDFs it lacks are on their way', () => {
    state.trips = [];
    state.staged = [staged('s1', { file_ids: '["f1"]' })];
    state.missing = ['f1'];
    const html = render();
    expect(html).toContain('aria-label="Cargando"');
    expect(html).not.toContain('disabled=""');
  });

  it('waits under the offline notice when it lacks a PDF and has no connection', () => {
    state.trips = [];
    state.staged = [staged('s1', { file_ids: '["f1"]' })];
    state.missing = ['f1'];
    state.online = false;
    const html = render();
    expect(html).toContain('todavía no llegaron a este dispositivo');
    expect(html).toContain('disabled=""');
    expect(html).not.toContain('aria-label="Cargando"');
  });

  it('is confirmed offline once the PDFs are here', () => {
    state.trips = [];
    state.staged = [staged('s1', { file_ids: '["f1"]' })];
    state.online = false;
    const html = render();
    expect(html).not.toContain('disabled=""');
    expect(html).not.toContain('todavía no llegaron');
  });
});
