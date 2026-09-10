import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { SESSION_STORAGE_KEY, storedSession, supabase } from './supabase';

const stored = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => stored.get(key) ?? null,
  setItem: (key: string, value: string) => void stored.set(key, value),
  removeItem: (key: string) => void stored.delete(key),
});

const session = {
  access_token: 'a',
  refresh_token: 'r',
  expires_at: 1,
  expires_in: 0,
  token_type: 'bearer',
  user: { id: 'u1' },
};

beforeEach(() => stored.clear());
afterAll(() => {
  vi.unstubAllGlobals();
  void supabase.auth.stopAutoRefresh();
});

describe('the stored session', () => {
  it('is read from where the installed client keeps it', () => {
    // The name is the client's rule; this is what catches the rule changing.
    expect((supabase.auth as unknown as { storageKey: string }).storageKey).toBe(
      SESSION_STORAGE_KEY,
    );
  });

  it('is what the client kept, with nothing asked of the server', () => {
    stored.set(SESSION_STORAGE_KEY, JSON.stringify(session));
    expect(storedSession()).toEqual(session);
  });

  it('is none on a device that holds none, or not what the client writes', () => {
    expect(storedSession()).toBeNull();
    stored.set(SESSION_STORAGE_KEY, 'not json');
    expect(storedSession()).toBeNull();
    stored.set(SESSION_STORAGE_KEY, JSON.stringify({ ...session, user: null }));
    expect(storedSession()).toBeNull();
    stored.set(SESSION_STORAGE_KEY, JSON.stringify({ ...session, refresh_token: undefined }));
    expect(storedSession()).toBeNull();
  });
});
