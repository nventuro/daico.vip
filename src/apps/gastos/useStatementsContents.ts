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
        if (active) setState({ contents: undefined, error: errorMessage(error) });
      },
    );
    return () => {
      active = false;
    };
  }, [statements, masterKey]);

  return state;
}
