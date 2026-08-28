import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { clearAll } from '../lib/offline/engine';
import { resetSyncStatus } from '../lib/offline/sync';
import { clearMasterKey } from '../hooks/useMasterKey';
import { AppContext } from './appContext';

/** localStorage key prefix for the cached membership verdict, keyed by user id. */
const MEMBER_CACHE_PREFIX = 'daico.isMember.';

/** The verdict this device last got for the user, if it ever got one. */
function cachedVerdict(userId: string): boolean | null {
  const stored = localStorage.getItem(MEMBER_CACHE_PREFIX + userId);
  return stored === null ? null : stored === '1';
}

export function AppProvider({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  // The cached verdict answers first, so a device that has been in before goes
  // straight past this gate; the live read below then confirms or revokes it.
  const [isMember, setIsMember] = useState(
    () => session !== null && cachedVerdict(session.user.id) === true,
  );
  const [loading, setLoading] = useState(
    () => session !== null && cachedVerdict(session.user.id) === null,
  );

  // Resolve membership from the database. RLS only lets members read the
  // `members` table, so a member sees at least one row and a non-member sees
  // none. A signed-in non-member (or no session at all) resolves to false,
  // which gates the entire app.
  //
  // Offline, or when the read fails (flaky link), the cached verdict stands.
  // This keeps a member from being locked out at the "Sin acceso" screen with
  // no connection. It's only a UI gate: the server's RLS is still the real
  // authority, so a non-member who somehow got a stale `true` still reads
  // nothing and has every queued write rejected on sync.
  useEffect(() => {
    let active = true;
    async function resolveMembership() {
      if (!session) {
        setIsMember(false);
        setLoading(false);
        return;
      }
      const cached = cachedVerdict(session.user.id);
      if (cached !== null) {
        setIsMember(cached);
        setLoading(false);
      }
      // Offline: don't even attempt the read (it would hang or fail).
      if (!navigator.onLine) {
        if (cached === null) {
          setIsMember(false);
          setLoading(false);
        }
        return;
      }
      if (cached === null) setLoading(true);
      const { data, error } = await supabase.from('members').select('email').limit(1);
      if (!active) return;
      if (error) {
        if (cached === null) setIsMember(false);
      } else {
        const member = (data?.length ?? 0) > 0;
        setIsMember(member);
        localStorage.setItem(MEMBER_CACHE_PREFIX + session.user.id, member ? '1' : '0');
      }
      setLoading(false);
    }
    void resolveMembership();
    return () => {
      active = false;
    };
  }, [session]);

  // A member's local data — pending edits, attachment files not yet uploaded —
  // is only as safe as the browser lets it be: without this, a browser short
  // on disk may evict the whole origin. Chromium grants it silently to an
  // installed app; Firefox asks once.
  useEffect(() => {
    if (isMember) void navigator.storage?.persist?.().catch(() => {});
  }, [isMember]);

  const signIn = useCallback(() => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signOut = useCallback(() => {
    // Clear the cached membership verdict and wipe local data (shared-device
    // hygiene) before ending the session. clearAll() is what spins up the local
    // DB worker; merely importing it does not.
    if (session) localStorage.removeItem(MEMBER_CACHE_PREFIX + session.user.id);
    resetSyncStatus();
    void clearAll().catch(() => {});
    void clearMasterKey().catch(() => {});
    supabase.auth.signOut();
  }, [session]);

  // Nothing drawn keeps the splash up.
  if (loading) return null;

  return (
    <AppContext.Provider value={{ session, isMember, signIn, signOut }}>
      {children}
    </AppContext.Provider>
  );
}
