import { useAppContext } from './appContext';
import { useOnline } from '../hooks/useOnline';
import Button from '../components/Button';

/** The way off a screen a member cannot get past. Signing out leaves the device
 *  holding nothing, and getting back in goes through Google — so with no
 *  connection it would strand whoever tapped it. Offered online only, and said
 *  so wherever the link is shown. */
export default function SignOutLink({ className = 'mt-6' }: { className?: string }) {
  const { signOut } = useAppContext();
  const online = useOnline();

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <Button variant="link" onClick={signOut} disabled={!online}>
        Cerrar sesión
      </Button>
      {!online && <p className="text-xs text-muted">Necesitás conexión para cerrar sesión.</p>}
    </div>
  );
}
