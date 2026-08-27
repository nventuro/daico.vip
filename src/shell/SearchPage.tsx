import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SEARCH_DEBOUNCE_MS } from '../types';
import { searchAll, type SearchGroup } from '../apps/search';
import { hueStyle } from './hue';

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
        if (active) setError(e instanceof Error ? e.message : String(e));
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
    body = <p className="text-muted">Buscá tareas, compras, guías, fechas y recetas.</p>;
  } else if (result.groups.length === 0) {
    // While a newer search is still running the previous answer stays on screen.
    body = <p className="text-muted">Nada por acá</p>;
  } else {
    body = result.groups.map(({ module, hits }) => (
      <section key={module.id}>
        <h2
          className="mb-2 text-xs font-semibold tracking-wide text-(--app) uppercase"
          style={hueStyle(module.hue)}
        >
          {module.name}
        </h2>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-raised">
          {hits.map((hit, i) => (
            <li key={i}>
              <Link
                to={hit.to}
                className="block px-4 py-3 transition-colors hover:bg-border-subtle"
              >
                <span className="block truncate">{hit.title}</span>
                {hit.subtitle && (
                  <span className="block truncate text-xs text-muted">{hit.subtitle}</span>
                )}
              </Link>
            </li>
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
          className="w-full rounded-full border border-border bg-surface-raised px-4 py-3 text-base outline-none placeholder:text-muted focus:border-primary"
        />
      </form>

      {error && <p className="text-sm text-error">Error: {error}</p>}

      {body}
    </div>
  );
}
