import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { clearAll } from '../lib/offline/engine';
import { AppContext } from './appContext';

/** localStorage key prefix for the cached membership verdict, keyed by user id. */
const MEMBER_CACHE_PREFIX = 'daico.isMember.';

export function AppProvider({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  // Resolve membership from the database. RLS only lets members read the
  // `members` table, so a member sees at least one row and a non-member sees
  // none. A signed-in non-member (or no session at all) resolves to false,
  // which gates the entire app.
  //
  // Offline, the live read fails — so we fall back to the last-known-good result
  // cached per user. This keeps a member from being locked out at the "Sin
  // acceso" screen with no connection. It's only a UI gate: the server's RLS is
  // still the real authority, so a non-member who somehow got a stale `true`
  // still reads nothing and has every queued write rejected on sync.
  useEffect(() => {
    async function resolveMembership() {
      setLoading(true);
      if (!session) {
        setIsMember(false);
        setLoading(false);
        return;
      }
      const cacheKey = MEMBER_CACHE_PREFIX + session.user.id;
      const { data, error } = await supabase.from('members').select('email').limit(1);
      if (error) {
        // Offline / transient: trust the last-known-good answer for this user.
        setIsMember(localStorage.getItem(cacheKey) === '1');
      } else {
        const member = (data?.length ?? 0) > 0;
        setIsMember(member);
        localStorage.setItem(cacheKey, member ? '1' : '0');
      }
      setLoading(false);
    }
    resolveMembership();
  }, [session]);

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
    void clearAll().catch(() => {});
    supabase.auth.signOut();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface text-on-surface flex items-center justify-center">
        <p className="text-muted text-lg">Cargando...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ session, isMember, signIn, signOut }}>
      {children}
    </AppContext.Provider>
  );
}
