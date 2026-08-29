import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DB_OWNER_LOCK } from './singleTab';

type LockCallback = (lock: { name: string } | null) => unknown;

/** A minimal Web Locks API: exclusive locks, `ifAvailable`, held while the callback runs. */
function fakeLocks() {
  const held = new Set<string>();
  return {
    request: async (name: string, options: { ifAvailable?: boolean }, callback: LockCallback) => {
      if (held.has(name)) {
        if (options.ifAvailable) return callback(null);
        throw new Error('fake locks: would block');
      }
      held.add(name);
      try {
        return await callback({ name });
      } finally {
        held.delete(name);
      }
    },
  };
}

async function load() {
  return (await import('./singleTab')).checkDbOwnership;
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('checkDbOwnership', () => {
  it('the first tab takes the lock and keeps it', async () => {
    const locks = fakeLocks();
    vi.stubGlobal('navigator', { locks });
    const check = await load();
    expect(await check()).toBe(true);
    expect(await check()).toBe(true);
    const probe = await locks.request(DB_OWNER_LOCK, { ifAvailable: true }, (lock) => lock);
    expect(probe).toBeNull();
  });

  it('a second tab does not own the database while the first holds the lock', async () => {
    const locks = fakeLocks();
    vi.stubGlobal('navigator', { locks });
    const firstTab = await load();
    expect(await firstTab()).toBe(true);
    vi.resetModules();
    const secondTab = await load();
    expect(await secondTab()).toBe(false);
  });

  it('owns the database where the Web Locks API is absent', async () => {
    vi.stubGlobal('navigator', {});
    expect(await (await load())()).toBe(true);
  });

  it('owns the database when the lock request fails', async () => {
    vi.stubGlobal('navigator', { locks: { request: () => Promise.reject(new Error('nope')) } });
    expect(await (await load())()).toBe(true);
  });
});
