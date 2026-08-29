import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { cachedVerdict, rememberVerdict } from '../lib/membershipCache';
import { installSyncTriggers } from '../lib/offline/sync';
import { AppContext } from './appContext';

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
        rememberVerdict(session.user.id, member);
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

  // What asks for a sync, for the whole app: the connection coming back, and
  // the app returning to the foreground. Only while a member is in — there is
  // nothing to sync for anyone else, and a run after a sign-out would build
  // the local store again right after the sign-out wiped it.
  useEffect(() => {
    if (!isMember) return;
    return installSyncTriggers();
  }, [isMember]);

  const signIn = useCallback(() => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signOut = useCallback(() => {
    // Only this device: the other one keeps its session, its data and its key.
    // What the device holds is forgotten when the session ends, wherever that
    // is handled — this button is only one of the ways it can end.
    void supabase.auth.signOut({ scope: 'local' });
  }, []);

  // Nothing drawn keeps the splash up.
  if (loading) return null;

  return (
    <AppContext.Provider value={{ session, isMember, signIn, signOut }}>
      {children}
    </AppContext.Provider>
  );
}
