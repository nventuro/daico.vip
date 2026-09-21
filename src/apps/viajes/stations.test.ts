import { describe, it, expect } from 'vitest';
import type { TripItem, TripKind, TripTransport } from '../../lib/offline/specs';
import { stationOptions } from './stations';

function row(
  kind: TripKind,
  transport: TripTransport | null,
  origin: string | null,
  destination: string | null,
): TripItem {
  return {
    id: `${origin}${destination}`,
    trip_id: 'v',
    kind,
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

describe('stationOptions', () => {
  it('offers nothing while no train or bus has been taken', () => {
    expect(stationOptions([])).toEqual([]);
    expect(stationOptions([row('ticket', 'flight', 'AEP', 'BRC')])).toEqual([]);
  });

  it('offers the stations and terminals already used, most used first, each once', () => {
    const items = [
      row('ticket', 'train', 'Estación Norte', 'Estación Sur'),
      row('ticket', 'bus', 'Terminal Centro', 'Estación Sur'),
      row('ticket', 'train', 'Estación Sur', null),
    ];
    expect(stationOptions(items)).toEqual(['Estación Sur', 'Estación Norte', 'Terminal Centro']);
  });
});
