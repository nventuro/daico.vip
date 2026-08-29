import { useEffect, useState, type FormEvent } from 'react';
import { IconKey, IconLock } from '@tabler/icons-react';
import {
  HOUSEHOLD_PHRASE_WORDS,
  createMasterKey,
  generatePhrase,
  parsePhrase,
  unwrapMasterKey,
} from '../lib/householdKey';
import { HOUSEHOLD_KEY_SPEC, type HouseholdKey } from '../lib/offline/specs';
import { supabase } from '../lib/supabase';
import { syncAll } from '../lib/offline/sync';
import { useOfflineTable } from '../hooks/useOfflineTable';
import { useOnline } from '../hooks/useOnline';
import { setMasterKey } from '../lib/masterKeyStore';
import Button from '../components/Button';
import CheckRow from '../components/CheckRow';
import ErrorLine from '../components/ErrorLine';
import Gate from './Gate';
import PhraseWords from './PhraseWords';
import SignOutLink from './SignOutLink';

/** Postgres: a row that would break a unique index. */
const UNIQUE_VIOLATION = '23505';

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
        <ErrorLine problem={problem} className="mt-3 text-left" />
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
      <CheckRow checked={noted} onToggle={() => setNoted((v) => !v)} className="mt-5 self-start">
        Ya las anoté
      </CheckRow>
      <ErrorLine problem={problem} className="mt-3 self-start text-left" />
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
  // Still finding out which: nothing drawn keeps the splash up.
  return null;
}
