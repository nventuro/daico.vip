import { useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, storedSession } from './lib/supabase';
import { afterSync } from './lib/offline/sync';
import { syncAttachmentFiles } from './lib/attachmentFiles';
import { clearDevice } from './lib/clearDevice';
import { apps } from './apps/registry';
import { AppProvider } from './shell/AppContext';
import MainLayout from './shell/MainLayout';

// Attachment files travel outside the tables; they follow every sync so a file
// added offline goes up as soon as the rows do, whichever screen is open. So
// does whatever an app keeps beside its tables.
afterSync(syncAttachmentFiles);
for (const app of apps) {
  if (app.afterSync) afterSync(app.afterSync);
}

/** Whether this is the page Google sends the member back to, the sign-in's
 *  code in its address: the one moment a session is on its way from the
 *  server and not on the device yet. */
function returningFromSignIn(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('code');
}

function App() {
  // The session the device holds answers at once, nothing asked of the
  // server, so the app opens with no signal. Coming back from Google there is
  // none yet, and the client is left to exchange the code — online, by
  // construction.
  const [returning] = useState(returningFromSignIn);
  const [session, setSession] = useState<Session | null>(() =>
    returning ? null : storedSession(),
  );
  const [authLoading, setAuthLoading] = useState(returning);
  // Whose session it is, for the moment it ends: by then there is none to ask.
  const userId = useRef<string | null>(session?.user.id ?? null);

  useEffect(() => {
    function hold(session: Session | null): void {
      userId.current = session?.user.id ?? null;
      setSession(session);
    }

    if (returning) {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        hold(session);
        setAuthLoading(false);
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only react to meaningful auth changes, not silent token refreshes.
      if (event === 'SIGNED_IN') hold(session);
      // However the session ended — the button, a refresh the server
      // refused, a sign-out from another device — the device keeps none of
      // it. A refresh that got no answer ends nothing: the client keeps the
      // session and asks again.
      if (event === 'SIGNED_OUT') {
        const previous = userId.current;
        hold(null);
        void clearDevice(previous);
      }
    });

    return () => subscription.unsubscribe();
  }, [returning]);

  // Nothing drawn keeps the splash up.
  if (authLoading) return null;

  return (
    <AppProvider session={session}>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
