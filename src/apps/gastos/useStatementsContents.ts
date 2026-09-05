import { useEffect, useState } from 'react';
import type { Statement } from '../../lib/offline/specs';
import { useMasterKey } from '../../hooks/useMasterKey';
import { errorMessage } from '../../utils/textUtils';
import { openOnce } from './openOnce';
import { openContents } from './payload';
import type { StatementContents } from './statement';

/** The contents of `statement`, unsealed with `masterKey`. */
export function openStatement(
  statement: Statement,
  masterKey: CryptoKey,
): Promise<StatementContents> {
  return openOnce(statement, () => openContents(masterKey, statement));
}

/** The contents of every statement given, by statement id; undefined until
 *  all are open (or while the device holds no key). By id and never by place
 *  in the list: the statements change under a screen while a sync runs, and
 *  what is opened lags them, so a place in one list is not a place in the
 *  other — and a mark written into the wrong statement is written for good. */
export function useStatementsContents(statements: Statement[]): {
  contents: ReadonlyMap<string, StatementContents> | undefined;
  error: string | null;
} {
  const masterKey = useMasterKey();
  const [state, setState] = useState<{
    contents: ReadonlyMap<string, StatementContents> | undefined;
    error: string | null;
  }>({ contents: undefined, error: null });

  useEffect(() => {
    if (masterKey.status !== 'unlocked') return;
    let active = true;
    Promise.all(
      statements.map(async (s) => [s.id, await openStatement(s, masterKey.key)] as const),
    ).then(
      (opened) => {
        if (active) setState({ contents: new Map(opened), error: null });
      },
      (error: unknown) => {
        if (active) setState({ contents: undefined, error: errorMessage(error) });
      },
    );
    return () => {
      active = false;
    };
  }, [statements, masterKey]);

  return state;
}
