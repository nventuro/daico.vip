import { Outlet } from 'react-router-dom';
import { IconLogout } from '@tabler/icons-react';
import { useAppContext } from '../context/appContext';
import LoginScreen from './LoginScreen';
import NoAccess from './NoAccess';
import Footer from './Footer';

export default function MainLayout() {
  const { session, isMember, signOut } = useAppContext();

  if (!session) return <LoginScreen />;
  if (!isMember) return <NoAccess />;

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="font-display text-xl font-extrabold tracking-tight text-primary">
            Daico
          </span>
          <button
            onClick={signOut}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted transition-colors hover:bg-border-subtle hover:text-muted-strong"
          >
            <IconLogout size={18} stroke={1.5} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <Footer className="px-4 pb-8" />
    </div>
  );
}
