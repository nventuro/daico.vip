import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { TableSpec, Trip, TripInboxItem, TripItem } from '../../lib/offline/specs';
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

/** A flight of `tripId`, leaving `on_date`. */
function flight(
  id: string,
  tripId: string,
  on_date: string,
  overrides: Partial<TripItem> = {},
): TripItem {
  return {
    id,
    trip_id: tripId,
    kind: 'ticket',
    title: id,
    on_date,
    at_time: '08:40',
    ends_on: on_date,
    ends_at: '11:05',
    from_code: 'AEP',
    to_code: 'BRC',
    done: false,
    comments: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// What the stores give back, set per test before the page is rendered.
const state: {
  trips: Trip[];
  tripItems: TripItem[];
  staged: TripInboxItem[];
  missing: string[];
  online: boolean;
} = {
  trips: [],
  tripItems: [],
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
  useOfflineTable: (spec: TableSpec) => ({
    items: spec.table === 'trip_items' ? state.tripItems : [],
    loading: false,
    error: null,
    insert: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }),
}));
vi.mock('../../hooks/useAttachments', () => ({
  useAttachments: () => ({ items: [], loading: false, error: null, addOpened: vi.fn() }),
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

function render(groupKey = 'e1') {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[`/viajes/inbox/${groupKey}`]}>
      <Routes>
        <Route path="/viajes/inbox/:groupKey" element={<InboxReviewPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** The values of the selector's options, in order. */
function options(html: string): string[] {
  return [...html.matchAll(/<option[^>]*value="([^"]+)"/g)].map((m) => m[1]);
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
    state.tripItems = [];
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
    expect(options(html)).toEqual(['próximo', 'lejano', 'sin fechas', 'create']);
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

  it('marks the rows that came with a file, and those alone', () => {
    state.trips = [];
    state.staged = [staged('s1', { file_ids: '["f1"]' }), staged('s2', { title: 'Sin PDF' })];
    const html = render();
    expect(html.match(/Tiene comentarios o adjuntos/g)).toHaveLength(1);
    expect(html.indexOf('Tiene comentarios o adjuntos')).toBeLessThan(html.indexOf('Sin PDF'));
  });

  it('carries the line while the files it lacks are on their way', () => {
    state.trips = [];
    state.staged = [staged('s1', { file_ids: '["f1"]' })];
    state.missing = ['f1'];
    const html = render();
    expect(html).toContain('aria-label="Cargando"');
    expect(html).not.toContain('disabled=""');
  });

  it('waits under the offline notice when it lacks a file and has no connection', () => {
    state.trips = [];
    state.staged = [staged('s1', { file_ids: '["f1"]' })];
    state.missing = ['f1'];
    state.online = false;
    const html = render();
    expect(html).toContain('todavía no llegaron a este dispositivo');
    expect(html).toContain('disabled=""');
    expect(html).not.toContain('aria-label="Cargando"');
  });

  it('is confirmed offline once the files are here', () => {
    state.trips = [];
    state.staged = [staged('s1', { file_ids: '["f1"]' })];
    state.online = false;
    const html = render();
    expect(html).not.toContain('disabled=""');
    expect(html).not.toContain('todavía no llegaron');
  });

  describe('a boarding pass', () => {
    const pass = staged('p1', {
      kind: 'boarding_pass',
      comments: 'Ana 14A · Bruno 14B',
      file_ids: '["f1", "f2"]',
    });

    it('asks for the pasaje, not the trip, starting on the flight that matches, and goes on the pasaje', () => {
      state.trips = [trip('próximo', fromToday(5), fromToday(12)), trip('lejano', fromToday(60))];
      state.tripItems = [
        flight('otro', 'próximo', fromToday(5)),
        flight('ida', 'próximo', fromToday(10)),
        flight('lejos', 'lejano', fromToday(60)),
      ];
      state.staged = [pass];
      const html = render('p1');
      expect(html).toContain('>Pasaje<');
      expect(html).not.toContain('>Viaje<');
      expect(html).toContain('<option value="ida" selected="">');
      expect(options(html)).toEqual([
        'otro',
        'ida',
        'lejos',
        'new:próximo',
        'new:lejano',
        'create',
      ]);
      expect(html).toContain('Crear el pasaje en «próximo»');
      expect(html).toContain('Crear viaje «Bariloche» con el pasaje');
      expect(html).toContain('2 boarding pass');
      expect(html).toContain('boarding pass · AEP → BRC');
      expect(html).toContain('Ana 14A · Bruno 14B');
      expect(html).toContain('Agregar al pasaje');
      expect(html).not.toContain('Agregar 1 ítem');
    });

    it('starts on a new pasaje in the next trip when no flight matches, and on a new trip when none is ahead', () => {
      state.trips = [trip('próximo', fromToday(5), fromToday(12))];
      state.tripItems = [flight('otro', 'próximo', fromToday(5), { title: 'LA 400' })];
      state.staged = [pass];
      expect(render('p1')).toContain('<option value="new:próximo" selected="">');
      state.trips = [];
      state.tripItems = [];
      expect(render('p1')).toContain('<option value="create" selected="">');
    });
  });
});
