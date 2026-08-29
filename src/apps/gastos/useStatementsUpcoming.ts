import { useMemo } from 'react';
import type { Upcoming } from '../types';
import { statementPath } from './paths';
import { useStatements } from './useStatements';
import { useStatementsContents } from './useStatementContents';
import { toPayCents } from './breakdown';
import { FORMAT_LABELS, formatArsCompact } from './labels';

/** The statements still to be paid, for the home screen, however far off
 *  they are due: each as one amount in pesos, the dollars valued at the
 *  statement's own rate. */
export function useStatementsUpcoming(): Upcoming[] | undefined {
  const { items, loading } = useStatements();
  const unpaid = useMemo(() => items.filter((statement) => !statement.paid), [items]);
  // The rate is in the sealed payload; only the statements shown are opened.
  const { contents } = useStatementsContents(unpaid);
  return useMemo(() => {
    if (loading || !contents || contents.length !== unpaid.length) return undefined;
    return unpaid.map((statement, i) => ({
      title: `${FORMAT_LABELS[statement.format]} · ${formatArsCompact(
        toPayCents({ ...statement, usd_rate: contents[i].usd_rate }),
      )}`,
      on: statement.due_on,
      to: statementPath(statement.id),
      appId: 'gastos',
    }));
  }, [loading, contents, unpaid]);
}
