import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AppContext } from './appContext';

export function AppProvider({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  // Resolve membership from the database. `is_member()` checks the signed-in
  // email against the members allowlist; a non-member signed-in account (or no
  // session at all) resolves to false, which gates the entire app.
  useEffect(() => {
    async function resolveMembership() {
      setLoading(true);
      if (session) {
        const { data } = await supabase.rpc('is_member');
        setIsMember(data === true);
      } else {
        setIsMember(false);
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
    supabase.auth.signOut();
  }, []);

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
