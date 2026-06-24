import { IconLock } from '@tabler/icons-react';
import { useAppContext } from '../context/appContext';
import { useOnline } from '../hooks/useOnline';

export default function NoAccess() {
  const { signOut } = useAppContext();
  const online = useOnline();

  return (
    <div className="min-h-dvh bg-surface text-on-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-border-subtle text-muted">
          <IconLock size={28} stroke={1.5} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sin acceso</h2>
        <p className="text-muted mb-8">
          Esta cuenta no está autorizada para entrar. Si creés que es un error, probá con otra cuenta.
        </p>
        {/* Sign-out revokes the session server-side, so it needs a connection. */}
        <button
          onClick={signOut}
          disabled={!online}
          className="text-muted underline transition-colors hover:text-muted-strong disabled:cursor-not-allowed disabled:no-underline disabled:hover:text-muted"
        >
          Cerrar sesión
        </button>
        {!online && (
          <p className="mt-3 text-xs text-muted">Necesitás conexión para cerrar sesión.</p>
        )}
      </div>
    </div>
  );
}
