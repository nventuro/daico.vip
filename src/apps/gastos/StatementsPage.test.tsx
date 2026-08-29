import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { Statement } from '../../lib/offline/specs';
import type { StatementContents } from './statement';

// Invented statements: nothing here comes from a real one.
function contentsOf(
  format: 'galicia-visa' | 'galicia-mastercard',
  previousClosedOn: string | null,
  closedOn: string,
): StatementContents {
  return {
    schema: 2,
    format,
    number: '1',
    previous_closed_on: previousClosedOn,
    closed_on: closedOn,
    due_on: closedOn,
    previous_ars_cents: 0,
    previous_usd_cents: 0,
    pending_ars_cents: 0,
    pending_usd_cents: 0,
    minimum_ars_cents: null,
    total_ars_cents: 100_000,
    total_usd_cents: 0,
    usd_rate: null,
    lines: [],
  };
}

function rowOf(id: string, contents: StatementContents): Statement {
  return {
    id,
    format: contents.format,
    closed_on: contents.closed_on,
    due_on: contents.due_on,
    total_ars_cents: contents.total_ars_cents,
    total_usd_cents: contents.total_usd_cents,
    paid: false,
    payload: '',
    wrapped_key: '',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

const all = [
  contentsOf('galicia-visa', '2026-05-28', '2026-07-02'),
  contentsOf('galicia-visa', '2026-07-02', '2026-07-28'),
  contentsOf('galicia-mastercard', null, '2026-06-15'),
];
const items = all.map((contents, i) => rowOf(`s${i}`, contents));

// What the store gives back, set per test before the page is rendered.
const state: { contents: StatementContents[] | undefined } = { contents: all };

vi.mock('./useStatements', () => ({
  useStatements: () => ({
    items,
    loading: false,
    error: null,
    add: vi.fn(),
    replace: vi.fn(),
    setPaid: vi.fn(),
    remove: vi.fn(),
  }),
}));
vi.mock('./useStatementContents', () => ({
  useStatementsContents: () => ({ contents: state.contents, error: null }),
  openStatement: vi.fn(),
}));
vi.mock('../../hooks/useMasterKey', () => ({
  useMasterKey: () => ({ status: 'unlocked', key: {} as CryptoKey }),
}));

function render() {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/gastos/resumenes']}>
      <StatementsPage />
    </MemoryRouter>,
  );
}

const { default: StatementsPage } = await import('./StatementsPage');

describe('StatementsPage', () => {
  it('lists every statement by the days it covers', () => {
    state.contents = all;
    const html = render();
    expect(html).toContain('3 al 28 jul 2026');
    expect(html).toContain('29 may al 2 jul 2026');
  });

  // The rows come from the store before their payloads are open, and the list
  // is built on every render, not only on the one that shows it.
  it('holds the list place while the statements are still opening', () => {
    state.contents = [];
    expect(render).not.toThrow();
    expect(render()).toContain('Cargando');
  });

  it('holds it while a statement just synced is opening', () => {
    state.contents = all.slice(0, 2);
    expect(render).not.toThrow();
    expect(render()).toContain('Cargando');
  });
});
