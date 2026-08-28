import { useCallback } from 'react';
import type { Statement } from '../../types';
import { STATEMENTS_SPEC } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { sealContents } from './payload';
import type { StatementContents } from './statement';

/** The row's columns in the clear, from what was read; whether it is paid
 *  is the household's to say, not the statement's. */
function columns(
  contents: StatementContents,
): Omit<Statement, 'id' | 'paid' | 'created_at' | 'updated_at'> {
  return {
    format: contents.format,
    closed_on: contents.closed_on,
    due_on: contents.due_on,
    total_ars_cents: contents.total_ars_cents,
    total_usd_cents: contents.total_usd_cents,
    payload: '',
    wrapped_key: '',
  };
}

/** Local-first statements, newest first. Adding or replacing one seals its
 *  contents under `masterKey` on the device; the server only ever sees the
 *  sealed payload. Every action is instant and works offline. */
export function useStatements() {
  const { items, loading, error, mutate } = useOfflineTable<Statement>(STATEMENTS_SPEC);

  /** Keeps a statement just read; resolves to its id, or undefined when it
   *  could not be written. */
  const add = useCallback(
    (contents: StatementContents, masterKey: CryptoKey): Promise<string | undefined> =>
      mutate(async () =>
        engine.insert(STATEMENTS_SPEC, {
          ...columns(contents),
          paid: false,
          ...(await sealContents(masterKey, contents)),
        }),
      ),
    [mutate],
  );

  /** Rewrites a statement: one imported again, or one whose lines were marked. */
  const replace = useCallback(
    (id: string, contents: StatementContents, masterKey: CryptoKey) =>
      mutate(async () =>
        engine.update(STATEMENTS_SPEC, id, {
          ...columns(contents),
          ...(await sealContents(masterKey, contents)),
        }),
      ),
    [mutate],
  );

  const setPaid = useCallback(
    (id: string, paid: boolean) => mutate(() => engine.update(STATEMENTS_SPEC, id, { paid })),
    [mutate],
  );

  const remove = useCallback(
    (statement: Statement) => mutate(() => engine.remove(STATEMENTS_SPEC, statement.id)),
    [mutate],
  );

  return { items, loading, error, add, replace, setPaid, remove };
}
