import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { TripItem, TripTransport } from '../../lib/offline/specs';
import type { ItemDatesValue } from './ItemDateFields';

/** A pasaje the household has already taken, for what its lists offer. */
function taken(transport: TripTransport, origin: string, destination: string): TripItem {
  return {
    id: `${origin}${destination}`,
    trip_id: 'v',
    kind: 'ticket',
    title: 'x',
    on_date: null,
    at_time: null,
    ends_on: null,
    ends_at: null,
    transport,
    origin,
    destination,
    done: false,
    comments: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

vi.mock('./useTripItems', () => ({
  useTripItems: () => ({
    items: [taken('flight', 'AEP', 'BRC'), taken('train', 'Estación Norte', 'Estación Sur')],
  }),
}));

const { default: ItemDateFields } = await import('./ItemDateFields');

function pasaje(overrides: Partial<ItemDatesValue>): string {
  const fields: ItemDatesValue = {
    on_date: null,
    at_time: null,
    ends_on: null,
    ends_at: null,
    transport: null,
    origin: null,
    destination: null,
    ...overrides,
  };
  return renderToStaticMarkup(<ItemDateFields kind="ticket" fields={fields} onChange={vi.fn()} />);
}

/** Which of the transports is drawn as the chosen one. */
function pressed(html: string): string[] {
  return [...html.matchAll(/aria-pressed="true"[^>]*>(?:<svg.*?<\/svg>)?([^<]+)</g)].map(
    (match) => match[1],
  );
}

describe("a pasaje's controls", () => {
  it('offers what it travels on, the one it has chosen', () => {
    const html = pasaje({ transport: 'train' });
    expect(html).toContain('Avión');
    expect(html).toContain('Micro');
    expect(pressed(html)).toEqual(['Tren']);
  });

  it('shows a flight its airports by name, offered from the list of them', () => {
    const html = pasaje({ transport: 'flight', origin: 'AEP', destination: 'XQX' });
    expect(html).toContain('aria-label="Aeropuerto de salida"');
    expect(html).toContain('value="AEP — Buenos Aires (Aeroparque)"');
    // One the list has never heard of is still its code.
    expect(html).toContain('value="XQX"');
    expect(html).toContain('<option value="BRC — Bariloche">');
    expect(html).not.toContain('Estación Norte');
  });

  it('shows a train its stations as written, offered from the ones already used', () => {
    const html = pasaje({ transport: 'train', origin: 'Estación Norte' });
    expect(html).toContain('aria-label="Estación de salida"');
    expect(html).toContain('aria-label="Estación de llegada"');
    expect(html).toContain('value="Estación Norte"');
    expect(html).toContain('<option value="Estación Sur">');
    expect(html).not.toContain('Bariloche');
  });

  it('asks a bus for its terminals', () => {
    expect(pasaje({ transport: 'bus' })).toContain('aria-label="Terminal de salida"');
  });

  it('takes one that does not say what it travels on for the usual one', () => {
    expect(pressed(pasaje({ transport: null }))).toEqual(['Avión']);
  });
});
