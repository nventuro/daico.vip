import { lazy, Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { IconLogout, IconSearch } from '@tabler/icons-react';
import { useAppContext } from '../context/appContext';
import { useOnline } from '../hooks/useOnline';
import { useDbOwnership } from '../hooks/useDbOwnership';
import LoginScreen from '../components/LoginScreen';
import NoAccess from '../components/NoAccess';

// Rarely shown (only a second tab hits it), so it's kept out of the main bundle.
const TabConflict = lazy(() => import('../components/TabConflict'));

export default function MainLayout() {
  const { session, isMember, signOut } = useAppContext();
  const online = useOnline();
  const dbOwnership = useDbOwnership();

  if (!session) return <LoginScreen />;
  if (!isMember) return <NoAccess />;
  // The local store allows one connection per browser; a second tab is diverted.
  if (dbOwnership === 'blocked')
    return (
      <Suspense fallback={null}>
        <TabConflict />
      </Suspense>
    );

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2">
            <img src="/mark.png" alt="" className="h-7 w-7" />
            <span className="font-display text-xl font-extrabold tracking-tight text-primary">
              Daico
            </span>
          </span>
          <div className="flex items-center gap-1">
            <Link
              to="/buscar"
              aria-label="Buscar"
              title="Buscar"
              className="flex items-center rounded-lg px-2 py-1 text-sm text-muted transition-colors hover:bg-border-subtle hover:text-muted-strong"
            >
              <IconSearch size={18} stroke={1.5} />
            </Link>
            <button
              onClick={signOut}
              disabled={!online}
              aria-label="Cerrar sesión"
              title={online ? 'Cerrar sesión' : 'Necesitás conexión para cerrar sesión'}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted transition-colors hover:bg-border-subtle hover:text-muted-strong disabled:cursor-not-allowed disabled:text-disabled disabled:hover:bg-transparent disabled:hover:text-disabled"
            >
              <IconLogout size={18} stroke={1.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
