import { Outlet } from 'react-router-dom';
import { IconLogout } from '@tabler/icons-react';
import { useAppContext } from '../context/appContext';
import { useOnline } from '../hooks/useOnline';
import LoginScreen from '../components/LoginScreen';
import NoAccess from '../components/NoAccess';

export default function MainLayout() {
  const { session, isMember, signOut } = useAppContext();
  const online = useOnline();

  if (!session) return <LoginScreen />;
  if (!isMember) return <NoAccess />;

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
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
