import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { errorMessage } from '../utils/textUtils';
import { apps } from '../apps/registry';
import { appHue } from '../apps/types';
import { searchAll, type SearchGroup } from './search';
import ErrorLine from '../components/ErrorLine';
import LinkRow from '../components/LinkRow';
import SectionLabel from '../components/SectionLabel';
import { hueStyle } from '../components/hue';

/** Pause in typing (ms) before the search box runs a search. */
const SEARCH_DEBOUNCE_MS = 200;

/** What the box says it looks through: the apps that search, as they are named. */
const SEARCHABLE = new Intl.ListFormat('es-AR', { type: 'conjunction' }).format(
  apps.filter((app) => app.search).map((app) => app.name.toLowerCase()),
);

interface SearchResult {
  /** The query these groups answer, so a stale answer is told apart from the current one. */
  query: string;
  groups: SearchGroup[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [result, setResult] = useState<SearchResult>({ query: '', groups: [] });
  const [error, setError] = useState<string | null>(null);

  // Search only once typing pauses, so a fast burst of keystrokes runs one search.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;
    searchAll(debounced)
      .then((groups) => {
        if (!active) return;
        setResult({ query: debounced, groups });
        setError(null);
      })
      .catch((e: unknown) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [debounced]);

  // Enter (the keyboard's "search" key) skips the pause and dismisses the keyboard.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDebounced(query);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  let body: ReactNode;
  if (!debounced.trim() || !result.query.trim()) {
    // Nothing searched yet: the hint also stays up while the first search runs,
    // rather than flashing an empty state.
    body = <p className="text-muted">Buscá {SEARCHABLE}.</p>;
  } else if (result.groups.length === 0) {
    // While a newer search is still running the previous answer stays on screen.
    body = <p className="text-muted">Nada por acá</p>;
  } else {
    body = result.groups.map(({ module, hits }) => (
      <section key={module.id}>
        <SectionLabel className="text-(--app)" style={hueStyle(appHue(module.id))}>
          {module.name}
        </SectionLabel>
        <ul>
          {hits.map((hit, i) => (
            <LinkRow key={i} to={hit.to} title={hit.title} subtitle={hit.subtitle} />
          ))}
        </ul>
      </section>
    ));
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={submit}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          enterKeyHint="search"
          aria-label="Buscar"
          placeholder="Buscar en todo..."
          className="w-full border border-border bg-surface-raised px-4 py-3 text-base transition-colors outline-none placeholder:text-muted focus:border-primary"
        />
      </form>

      <ErrorLine error={error} />

      {body}
    </div>
  );
}
