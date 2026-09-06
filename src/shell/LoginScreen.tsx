import { useEffect, useState } from 'react';
import { IconBrandGoogleFilled } from '@tabler/icons-react';
import { useAppContext } from './appContext';
import { useOnline } from '../hooks/useOnline';
import Button from '../components/Button';
import ErrorLine from '../components/ErrorLine';
import Footer from './Footer';
import Logo from './Logo';

/** Whether `href` is a sign-in the auth server sent back refused: it returns
 *  to the page the sign-in left with the refusal in the address, in the query
 *  or in the fragment. */
function refusedSignIn(href: string): boolean {
  const url = new URL(href);
  return (
    new URLSearchParams(url.search).has('error') ||
    new URLSearchParams(url.hash.slice(1)).has('error')
  );
}

export default function LoginScreen() {
  const { signIn } = useAppContext();
  const online = useOnline();
  // A refused sign-in — a member who picked the wrong Google account, or an
  // account the household never let in — comes back to this screen, which
  // would otherwise say nothing of it. Read once, and taken off the address
  // so a reload does not say it again.
  const [refused] = useState(
    () => typeof window !== 'undefined' && refusedSignIn(window.location.href),
  );
  useEffect(() => {
    if (refused) window.history.replaceState(window.history.state, '', window.location.pathname);
  }, [refused]);

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
          <Button
            onClick={signIn}
            disabled={!online}
            className="flex w-full items-center justify-center gap-3 px-5 py-3"
          >
            <IconBrandGoogleFilled size={20} stroke={1.5} />
            Ingresá con Google
          </Button>
          {!online && <p className="mt-4 text-sm text-muted">Necesitás conexión para ingresar.</p>}
          {refused && (
            <ErrorLine
              problem="No se pudo entrar con esa cuenta. Probá con otra."
              className="mt-4"
            />
          )}
        </div>
        <Footer className="mt-auto py-8" />
      </div>
    </div>
  );
}
