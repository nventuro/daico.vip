// =============================================================================
// The membership verdict this device last got from the server, one per user.
// It is what lets a member who opens the app with no connection past the gate,
// and it is forgotten when the session ends. Only a UI gate: the server's RLS
// is the authority, so a stale verdict still reads nothing.
// =============================================================================

/** localStorage key prefix for the cached verdict, keyed by user id. */
const MEMBER_CACHE_PREFIX = 'daico.isMember.';

// Storage may be absent or refuse (a private window, a storage policy); then
// this device simply has no verdict to go on and asks the server.
function storage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

/** The verdict this device last got for the user, if it ever got one. */
export function cachedVerdict(userId: string): boolean | null {
  const stored = storage()?.getItem(MEMBER_CACHE_PREFIX + userId);
  return stored === null || stored === undefined ? null : stored === '1';
}

/** Keep the verdict the server just gave for the user. */
export function rememberVerdict(userId: string, member: boolean): void {
  storage()?.setItem(MEMBER_CACHE_PREFIX + userId, member ? '1' : '0');
}

/** Forget the verdict for the user, so the next session asks the server. */
export function forgetVerdict(userId: string): void {
  storage()?.removeItem(MEMBER_CACHE_PREFIX + userId);
}
