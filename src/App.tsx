import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { AppProvider } from './context/AppContext';
import MainLayout from './shell/MainLayout';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only react to meaningful auth changes, not silent token refreshes.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface text-on-surface">
        <p className="text-lg text-muted">Cargando...</p>
      </div>
    );
  }

  return (
    <AppProvider session={session}>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
