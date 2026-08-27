import { IconBrandGoogleFilled } from '@tabler/icons-react';
import { useAppContext } from '../context/appContext';
import { useOnline } from '../hooks/useOnline';
import Footer from './Footer';
import Logo from './Logo';

export default function LoginScreen() {
  const { signIn } = useAppContext();
  const online = useOnline();

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <Logo className="mx-auto mb-5 h-30 w-30" />
          <h1 className="mb-1.5 font-display text-5xl font-black tracking-tight">daico</h1>
          <p className="mb-10 text-muted">Todo en orden, en un solo lugar.</p>

          {/* Sign-in is a Google OAuth redirect — it can't work offline. */}
          <button
            onClick={signIn}
            disabled={!online}
            className="flex w-full items-center justify-center gap-3 bg-primary px-5 py-3 font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-disabled disabled:hover:bg-disabled"
          >
            <IconBrandGoogleFilled size={20} stroke={1.5} />
            Ingresá con Google
          </button>
          {!online && <p className="mt-4 text-sm text-muted">Necesitás conexión para ingresar.</p>}
        </div>
      </div>
      <Footer className="px-4 pb-8" />
    </div>
  );
}
