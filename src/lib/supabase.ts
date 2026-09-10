import { createClient, type Session } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config';
import { REQUEST_TIMEOUT_MS, fetchWithin } from './fetchWithin';

// PKCE, so the redirect brings back a code and not the tokens themselves: with
// the implicit flow they arrive in the URL fragment, where the browser's
// history keeps them and anything running on the page can read them.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { flowType: 'pkce' },
  // Every request the client makes — a table's, the token's refresh — is
  // given up unanswered after the bound rather than held open by the browser.
  global: { fetch: (input, init) => fetchWithin(REQUEST_TIMEOUT_MS, input, init) },
});

/** Where the client keeps the session between visits: the client's own rule
 *  for the name, pinned against the installed client by a test. */
export const SESSION_STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;

function isSession(value: unknown): value is Session {
  if (value === null || typeof value !== 'object') return false;
  const { access_token, refresh_token, user } = value as Record<string, unknown>;
  return (
    typeof access_token === 'string' &&
    typeof refresh_token === 'string' &&
    user !== null &&
    typeof user === 'object' &&
    typeof (user as { id?: unknown }).id === 'string'
  );
}

/**
 * The session the client kept from the last visit, read off the device and
 * nothing asked of the server; null when the device holds none. What the
 * client's own read does first, when the token is about to expire, is refresh
 * it — a request that a device with no signal waits on for minutes — and the
 * app needs nothing from the server to open, only who is in. The client's
 * events are what say when a session ends.
 */
export function storedSession(): Session | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored === null) return null;
    const session: unknown = JSON.parse(stored);
    return isSession(session) ? session : null;
  } catch {
    // No storage to read (a private window that blocks it), or not what the
    // client writes: the device holds no session, then.
    return null;
  }
}
