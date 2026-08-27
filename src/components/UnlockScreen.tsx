import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { IconKey, IconLock, type TablerIcon } from '@tabler/icons-react';
import { HOUSEHOLD_PHRASE_WORDS, type HouseholdKey } from '../types';
import { supabase } from '../lib/supabase';
import { HOUSEHOLD_KEY_SPEC } from '../lib/offline/specs';
import { syncAll } from '../lib/offline/sync';
import { createMasterKey, generatePhrase, parsePhrase, unwrapMasterKey } from '../lib/householdKey';
import { useOfflineTable } from '../hooks/useOfflineTable';
import { useOnline } from '../hooks/useOnline';
import { setMasterKey } from '../hooks/useMasterKey';
import { useAppContext } from '../context/appContext';
import Button from './Button';
import CheckSquare from './CheckSquare';
import PhraseWords from './PhraseWords';

/** Postgres: a row that would break a unique index. */
const UNIQUE_VIOLATION = '23505';

function Gate({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: TablerIcon;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 text-on-surface">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center border border-border bg-surface-raised text-muted">
          <Icon size={28} stroke={1.5} />
        </div>
        <h2 className="mb-2 font-display text-2xl font-black tracking-tight">{title}</h2>
        <p className="text-muted">{text}</p>
        {children}
      </div>
    </div>
  );
}

function SignOutLink() {
  const { signOut } = useAppContext();
  const online = useOnline();
  return (
    <button
      onClick={signOut}
      disabled={!online}
      className="mt-6 text-muted underline transition-colors hover:text-muted-strong disabled:cursor-not-allowed disabled:no-underline disabled:hover:text-muted"
    >
      Cerrar sesión
    </button>
  );
}

/** Typing the phrase on a device that has the household's wrapped key. */
function UnlockForm({ wrapped }: { wrapped: HouseholdKey }) {
  const [words, setWords] = useState<string[]>(() => Array(HOUSEHOLD_PHRASE_WORDS).fill(''));
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const phrase = parsePhrase(words);
    if (!phrase) {
      setProblem('Alguna palabra no está en la lista. Revisá lo que escribiste.');
      return;
    }
    setBusy(true);
    setProblem(null);
    const key = await unwrapMasterKey(phrase, wrapped);
    if (!key) {
      setProblem('La frase no es correcta. Revisá cada palabra.');
      setBusy(false);
      return;
    }
    await setMasterKey(key);
  }

  return (
    <Gate
      icon={IconLock}
      title="Este dispositivo está cerrado"
      text="Los documentos están cifrados. Escribí las seis palabras de la frase de la casa, en orden, para leerlos acá."
    >
      <form onSubmit={handleSubmit} className="mt-7 flex w-full flex-col">
        <PhraseWords words={words} onChange={setWords} />
        {problem && <p className="mt-3 text-left text-sm text-error">{problem}</p>}
        <Button type="submit" disabled={busy} className="mt-4 w-full">
          {busy ? 'Abriendo...' : 'Abrir'}
        </Button>
      </form>
      <SignOutLink />
    </Gate>
  );
}

/** The first member's setup: a fresh phrase to write down, then the key it
 *  wraps goes to the server. Online only, straight to the server, so two
 *  members setting up at once can never both succeed. */
function NewPhraseForm() {
  const [words] = useState(generatePhrase);
  const [noted, setNoted] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function finish() {
    if (busy || !noted) return;
    setBusy(true);
    setProblem(null);
    const { key, wrapped } = await createMasterKey(words);
    const { error } = await supabase.from('household_key').insert(wrapped);
    if (error) {
      setProblem(
        error.code === UNIQUE_VIOLATION
          ? 'Alguien ya creó la frase de la casa. Pedísela y escribila acá.'
          : `No se pudo guardar: ${error.message}`,
      );
      setBusy(false);
      // Pulls the phrase someone else created, which turns this into the unlock screen.
      void syncAll();
      return;
    }
    await syncAll();
    await setMasterKey(key);
  }

  return (
    <Gate
      icon={IconKey}
      title="La frase de la casa"
      text="Estas seis palabras cifran los documentos de la casa. Anotalas en papel, en orden."
    >
      <div className="mt-7 w-full">
        <PhraseWords words={words} />
      </div>
      <p className="mt-4 text-sm text-muted">
        Son la única forma de abrir los documentos en un dispositivo nuevo. Si se pierden, no se
        pueden recuperar.
      </p>
      <button
        type="button"
        onClick={() => setNoted((v) => !v)}
        aria-pressed={noted}
        className="mt-5 flex items-center gap-3 self-start"
      >
        <CheckSquare checked={noted} />
        Ya las anoté
      </button>
      {problem && <p className="mt-3 self-start text-left text-sm text-error">{problem}</p>}
      <Button onClick={finish} disabled={!noted || busy} className="mt-4 w-full">
        {busy ? 'Guardando...' : 'Listo'}
      </Button>
    </Gate>
  );
}

/**
 * The screen a member sees after signing in on a device that doesn't hold the
 * master key: the phrase is asked for, or generated the very first time.
 * Which of the two it is comes from the household_key table — pulled by the
 * first sync — and, while that table is still empty, from asking the server
 * directly, since an empty local table on a new device means nothing yet.
 */
export default function UnlockScreen() {
  const { items, loading } = useOfflineTable<HouseholdKey>(HOUSEHOLD_KEY_SPEC);
  const online = useOnline();
  // null: not asked yet or unreachable.
  const [serverHasKey, setServerHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading || items.length > 0 || !online) return;
    let active = true;
    supabase
      .from('household_key')
      .select('id')
      .limit(1)
      .then(({ data, error }) => {
        if (active && !error) setServerHasKey((data?.length ?? 0) > 0);
      });
    return () => {
      active = false;
    };
  }, [loading, items.length, online]);

  if (items.length > 0) return <UnlockForm wrapped={items[0]} />;
  if (!loading && !online) {
    return (
      <Gate
        icon={IconLock}
        title="Este dispositivo está cerrado"
        text="Para abrirlo por primera vez necesitás conexión."
      >
        <SignOutLink />
      </Gate>
    );
  }
  if (serverHasKey === false) return <NewPhraseForm />;
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface text-on-surface">
      <p className="text-lg text-muted">Cargando...</p>
    </div>
  );
}
