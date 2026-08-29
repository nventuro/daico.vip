import { lazy, Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { IconLogout, IconSearch } from '@tabler/icons-react';
import IconButton from '../components/IconButton';
import { useAppContext } from './appContext';
import { useOnline } from '../hooks/useOnline';
import { useDbOwnership } from '../hooks/useDbOwnership';
import { useMasterKey } from '../hooks/useMasterKey';
import { useSyncStatus } from '../hooks/useSyncStatus';
import LoginScreen from './LoginScreen';
import NoAccessScreen from './NoAccessScreen';
import UnlockScreen from './UnlockScreen';
import FirstSyncScreen from './FirstSyncScreen';

// Rarely shown (only a second tab hits it), so it's kept out of the main bundle.
const TabConflictScreen = lazy(() => import('./TabConflictScreen'));

export default function MainLayout() {
  const { session, isMember, signOut } = useAppContext();
  const online = useOnline();
  const dbOwnership = useDbOwnership();
  const masterKey = useMasterKey();
  const sync = useSyncStatus();
  const [enteredEarly, setEnteredEarly] = useState(false);

  if (!session) return <LoginScreen />;
  if (!isMember) return <NoAccessScreen />;
  // The local store allows one connection per browser; a second tab is diverted.
  if (dbOwnership === 'blocked')
    return (
      <Suspense fallback={null}>
        <TabConflictScreen />
      </Suspense>
    );
  // A device without the household's master key stops here until the phrase
  // is typed: the documents it would show are unreadable without it.
  if (masterKey.status === 'loading') return null;
  if (masterKey.status === 'locked') return <UnlockScreen />;
  // A device that has never brought everything down shows what is on its way,
  // unless the member would rather go in meanwhile.
  if (sync.completedAt === null && !enteredEarly)
    return <FirstSyncScreen onEnter={() => setEnteredEarly(true)} />;

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <header className="sticky top-0 z-10 border-b-2 border-on-surface bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2.5">
            <span className="font-display text-2xl font-black tracking-tight">daico</span>
            {sync.syncing && (
              <span
                role="status"
                aria-label="Sincronizando"
                title="Sincronizando"
                className="size-2.5 animate-turn bg-on-surface"
              />
            )}
          </span>
          <div className="flex items-center gap-1">
            <IconButton
              label="Buscar"
              icon={IconSearch}
              to="/buscar"
              tone="band"
              className="px-2 py-1"
            />
            <IconButton
              label="Cerrar sesión"
              title={online ? 'Cerrar sesión' : 'Necesitás conexión para cerrar sesión'}
              icon={IconLogout}
              tone="band"
              className="px-2 py-1 disabled:cursor-not-allowed disabled:text-disabled disabled:hover:opacity-100"
              onClick={signOut}
              disabled={!online}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-6">
        <Outlet />
      </main>
    </div>
  );
}
