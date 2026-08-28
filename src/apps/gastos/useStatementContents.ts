import { useEffect, useMemo, useState } from 'react';
import type { Statement } from '../../types';
import { useMasterKey } from '../../hooks/useMasterKey';
import { openContents } from './payload';
import type { StatementContents } from './statement';

// Opened once per version of a row, so returning to a statement, or reading
// every statement for the trends, never decrypts the same payload twice.
const opened = new Map<string, Promise<StatementContents>>();

/** The contents of `statement`, unsealed with `masterKey`. */
export function openStatement(
  statement: Statement,
  masterKey: CryptoKey,
): Promise<StatementContents> {
  const key = `${statement.id}:${statement.updated_at}`;
  let promise = opened.get(key);
  if (!promise) {
    promise = openContents(masterKey, statement);
    opened.set(key, promise);
    promise.catch(() => opened.delete(key));
  }
  return promise;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** The contents of every statement given, in the same order; undefined
 *  until all are open (or while the device holds no key). */
export function useStatementsContents(statements: Statement[]): {
  contents: StatementContents[] | undefined;
  error: string | null;
} {
  const masterKey = useMasterKey();
  const [state, setState] = useState<{
    contents: StatementContents[] | undefined;
    error: string | null;
  }>({ contents: undefined, error: null });

  useEffect(() => {
    if (masterKey.status !== 'unlocked') return;
    let active = true;
    Promise.all(statements.map((s) => openStatement(s, masterKey.key))).then(
      (contents) => {
        if (active) setState({ contents, error: null });
      },
      (error: unknown) => {
        if (active) setState({ contents: undefined, error: message(error) });
      },
    );
    return () => {
      active = false;
    };
  }, [statements, masterKey]);

  return state;
}

/** The contents of one statement; undefined until open, or when there is
 *  no statement. */
export function useStatementContents(statement: Statement | undefined): {
  contents: StatementContents | undefined;
  error: string | null;
} {
  const list = useMemo(() => (statement ? [statement] : []), [statement]);
  const { contents, error } = useStatementsContents(list);
  return { contents: statement && contents?.length === 1 ? contents[0] : undefined, error };
}
