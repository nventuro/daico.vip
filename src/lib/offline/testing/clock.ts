// =============================================================================
// What a store test controls about the world around the code under test: the
// clock every row is stamped with, and whether the device has a connection.
// =============================================================================
import { vi } from 'vitest';

/** Three moments a second apart: enough to order a write against another. */
export const T0 = '2026-08-27T10:00:00.000Z';
export const T1 = '2026-08-27T10:00:01.000Z';
export const T2 = '2026-08-27T10:00:02.000Z';

/** Pin the clock the store stamps `created_at` / `updated_at` with. Needs the
 *  file's fake timers (`vi.useFakeTimers({ toFake: ['Date'] })`). */
export function at(iso: string): void {
  vi.setSystemTime(new Date(iso));
}

/** Whether the device is online. Node's navigator has no `onLine`, and the
 *  sync engine bails out without it. */
export const network = { online: true };

Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => network.online });
