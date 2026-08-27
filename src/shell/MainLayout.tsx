import { lazy, Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { IconLogout, IconSearch } from '@tabler/icons-react';
import { useAppContext } from '../context/appContext';
import { useOnline } from '../hooks/useOnline';
import { useDbOwnership } from '../hooks/useDbOwnership';
import { useMasterKey } from '../hooks/useMasterKey';
import LoginScreen from '../components/LoginScreen';
import NoAccess from '../components/NoAccess';
import UnlockScreen from '../components/UnlockScreen';

// Rarely shown (only a second tab hits it), so it's kept out of the main bundle.
const TabConflict = lazy(() => import('../components/TabConflict'));

export default function MainLayout() {
  const { session, isMember, signOut } = useAppContext();
  const online = useOnline();
  const dbOwnership = useDbOwnership();
  const masterKey = useMasterKey();

  if (!session) return <LoginScreen />;
  if (!isMember) return <NoAccess />;
  // The local store allows one connection per browser; a second tab is diverted.
  if (dbOwnership === 'blocked')
    return (
      <Suspense fallback={null}>
        <TabConflict />
      </Suspense>
    );
  // A device without the household's master key stops here until the phrase
  // is typed: the documents it would show are unreadable without it.
  if (masterKey.status === 'loading') return null;
  if (masterKey.status === 'locked') return <UnlockScreen />;

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <header className="sticky top-0 z-10 border-b-2 border-on-surface bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="font-display text-2xl font-black tracking-tight">daico</span>
          <div className="flex items-center gap-1">
            <Link
              to="/buscar"
              aria-label="Buscar"
              title="Buscar"
              className="flex items-center px-2 py-1 text-on-surface transition-opacity hover:opacity-70"
            >
              <IconSearch size={20} stroke={1.75} />
            </Link>
            <button
              onClick={signOut}
              disabled={!online}
              aria-label="Cerrar sesión"
              title={online ? 'Cerrar sesión' : 'Necesitás conexión para cerrar sesión'}
              className="flex items-center px-2 py-1 text-on-surface transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:text-disabled disabled:hover:opacity-100"
            >
              <IconLogout size={20} stroke={1.75} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-6">
        <Outlet />
      </main>
    </div>
  );
}
