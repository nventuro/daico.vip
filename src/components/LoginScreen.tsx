import {
  IconBrandGoogleFilled,
  IconChecklist,
  IconCalendarEvent,
  IconFileText,
} from '@tabler/icons-react';
import { useAppContext } from '../context/appContext';
import Footer from './Footer';

const FEATURES = [
  {
    icon: IconChecklist,
    title: 'Tareas',
    description: 'Anotá y seguí las cosas que hay que hacer en casa, con fechas.',
  },
  {
    icon: IconCalendarEvent,
    title: 'Turnos',
    description: 'Organizá turnos médicos y citas importantes en un solo lugar.',
  },
  {
    icon: IconFileText,
    title: 'Documentos',
    description: 'Tené a mano los documentos importantes del hogar, de forma segura.',
  },
];

export default function LoginScreen() {
  const { signIn } = useAppContext();

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center">
          <img src="/logo.png" alt="Daico" className="mx-auto mb-4 h-28 w-28" />
          <h1 className="mb-2 font-display text-5xl font-extrabold tracking-tight text-primary">
            Daico
          </h1>
          <p className="text-lg text-muted-strong">Todo en orden, en un solo lugar.</p>
          <p className="mx-auto mt-4 max-w-sm text-muted">
            Daico es una aplicación privada para organizar la vida del hogar: reuní
            las tareas pendientes, los turnos y los documentos importantes en un
            solo lugar, simple y seguro.
          </p>
        </div>

        {/* Sign in */}
        <div className="mt-8">
          <button
            onClick={signIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-hover"
          >
            <IconBrandGoogleFilled size={20} stroke={1.5} />
            Ingresá con Google
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            El acceso está reservado a los miembros del hogar.
          </p>
        </div>

        {/* What it does */}
        <section className="mt-12">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Qué podés hacer
          </h2>
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface-raised p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                  <Icon size={22} stroke={1.5} />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer className="px-4 pb-8" />
    </div>
  );
}
