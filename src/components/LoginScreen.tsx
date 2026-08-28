import { IconBrandGoogleFilled } from '@tabler/icons-react';
import { useAppContext } from '../context/appContext';
import { useOnline } from '../hooks/useOnline';
import Footer from './Footer';
import Logo from './Logo';

export default function LoginScreen() {
  const { signIn } = useAppContext();
  const online = useOnline();

  // The same frame as the splash this screen takes over from, so nothing
  // moves: the mark at the screen's centre, the rest hanging below it.
  return (
    <div className="grid min-h-dvh grid-rows-[1fr_auto_1fr] justify-items-center bg-surface text-on-surface">
      <Logo className="row-start-2 h-30 w-30" />
      <div className="row-start-3 flex w-full flex-col items-center px-4 pt-5 text-center">
        <div className="flex w-full max-w-sm flex-col items-center">
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
        <Footer className="mt-auto py-8" />
      </div>
    </div>
  );
}
