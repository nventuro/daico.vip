// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
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
    origin_time_zone: null,
    destination_time_zone: null,
    carry_on_bags: null,
    checked_bags: null,
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

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = '';
});

function fieldsOf(overrides: Partial<ItemDatesValue>): ItemDatesValue {
  return {
    on_date: null,
    at_time: null,
    ends_on: null,
    ends_at: null,
    transport: null,
    origin: null,
    destination: null,
    origin_time_zone: null,
    destination_time_zone: null,
    carry_on_bags: null,
    checked_bags: null,
    ...overrides,
  };
}

function pasaje(overrides: Partial<ItemDatesValue>): string {
  return renderToStaticMarkup(
    <ItemDateFields kind="ticket" fields={fieldsOf(overrides)} onChange={vi.fn()} />,
  );
}

/** The pasaje drawn to be written on, and its controls found by name. */
function drawn(overrides: Partial<ItemDatesValue>, onChange: (patch: object) => void) {
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root!.render(<ItemDateFields kind="ticket" fields={fieldsOf(overrides)} onChange={onChange} />),
  );
  return (label: string) => container.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)!;
}

/** Types `text` into a field, as a whole, and leaves it. */
function typeInto(input: HTMLInputElement, text: string) {
  act(() => {
    input.focus();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  act(() => input.blur());
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

  it('shows a flight its airports by name, offering the ones already flown through', () => {
    const html = pasaje({ transport: 'flight', origin: 'AEP', destination: 'XQX' });
    expect(html).toContain('aria-label="Aeropuerto de salida"');
    expect(html).toContain('value="AEP — Buenos Aires (Aeroparque)"');
    // One the list has never heard of is still its code.
    expect(html).toContain('value="XQX"');
    expect(html).toContain('<option value="BRC — Bariloche">');
    // The list is thousands: until something is typed, only its own are drawn.
    expect(html).not.toContain('<option value="MAD');
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

  it('asks a flight for its luggage, each count in words', () => {
    const html = pasaje({ transport: 'flight', carry_on_bags: 1, checked_bags: 2 });
    expect(html).toContain('aria-label="Equipaje de mano"');
    expect(html).toContain('<option value="1" selected="">1 de mano</option>');
    expect(html).toContain('<option value="2" selected="">2 despachados</option>');
    expect(html).toContain('<option value="1">1 despachado</option>');
  });

  it('still offers a count above the usual ones when an email said it', () => {
    expect(pasaje({ transport: 'flight', checked_bags: 7 })).toContain(
      '<option value="7" selected="">7 despachados</option>',
    );
  });

  it('reads what each count is while a flight never said it', () => {
    const html = pasaje({ transport: 'flight' });
    expect(html).toContain('<option value="" disabled="" selected="">De mano</option>');
    expect(html).toContain('<option value="" disabled="" selected="">Despachado</option>');
  });

  it('asks no other transport for its luggage', () => {
    expect(pasaje({ transport: 'train' })).not.toContain('Equipaje');
    expect(pasaje({ transport: 'bus' })).not.toContain('Equipaje');
  });

  it('takes one that does not say what it travels on for the usual one', () => {
    expect(pressed(pasaje({ transport: null }))).toEqual(['Avión']);
  });

  it('says how long it takes once both hours and both zones are known', () => {
    const flight = {
      transport: 'flight' as const,
      origin: 'EZE',
      destination: 'MAD',
      on_date: '2026-11-14',
      at_time: '13:25',
      ends_on: '2026-11-15',
      ends_at: '05:35',
    };
    const html = pasaje(flight);
    expect(html).toContain('Duración');
    expect(html).toContain('12 h 10 min');
    expect(pasaje({ ...flight, ends_at: null })).not.toContain('Duración');
    expect(pasaje({ ...flight, transport: 'train' })).not.toContain('Duración');
  });

  it('lets go of the zone of a station written over by hand, and keeps the other end’s', () => {
    const onChange = vi.fn();
    const field = drawn(
      {
        transport: 'train',
        origin: 'London St Pancras International',
        destination: 'Paris Gare du Nord',
        origin_time_zone: 'Europe/London',
        destination_time_zone: 'Europe/Paris',
      },
      onChange,
    );
    typeInto(field('Estación de salida'), 'Ebbsfleet International');
    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      origin: 'Ebbsfleet International',
      origin_time_zone: null,
    });
  });
});
