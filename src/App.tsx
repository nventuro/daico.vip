import { useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
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

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Whose session it is, for the moment it ends: by then there is none to ask.
  const userId = useRef<string | null>(null);

  useEffect(() => {
    function hold(session: Session | null): void {
      userId.current = session?.user.id ?? null;
      setSession(session);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      hold(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only react to meaningful auth changes, not silent token refreshes.
      if (event === 'SIGNED_IN') hold(session);
      // However the session ended — the button, a refresh that failed, a
      // sign-out from another device — the device keeps none of it.
      if (event === 'SIGNED_OUT') {
        const previous = userId.current;
        hold(null);
        void clearDevice(previous);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Nothing drawn keeps the splash up.
  if (authLoading) return null;

  return (
    <AppProvider session={session}>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
