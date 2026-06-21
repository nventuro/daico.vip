import { IconBrandGoogleFilled } from '@tabler/icons-react';
import { useAppContext } from '../context/appContext';
import Footer from './Footer';

export default function LoginScreen() {
  const { signIn } = useAppContext();

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <img
            src="/logo.png"
            alt="Daico"
            className="mx-auto mb-4 h-28 w-28"
          />
          <h1 className="mb-2 font-display text-5xl font-extrabold tracking-tight text-primary">
            Daico
          </h1>
          <p className="mb-10 text-muted">Todo en orden, en un solo lugar.</p>

          <button
            onClick={signIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-hover"
          >
            <IconBrandGoogleFilled size={20} stroke={1.5} />
            Ingresá con Google
          </button>
        </div>
      </div>
      <Footer className="px-4 pb-8" />
    </div>
  );
}
