import { useMemo } from 'react';
import { STATEMENT_NOTICE_DAYS } from '../../types';
import type { Upcoming } from '../types';
import { daysUntil, todayIso } from '../../utils/dateUtils';
import { useStatements } from './useStatements';
import { useStatementsContents } from './useStatementContents';
import { inPesos } from './breakdown';
import { FORMAT_LABELS, formatArsCompact } from './labels';

/** The statements about to be debited, for the home screen: each as one
 *  amount in pesos, the dollars valued at the statement's own rate. */
export function useStatementsUpcoming(): Upcoming[] | undefined {
  const { items, loading } = useStatements();
  const today = todayIso();
  const dueSoon = useMemo(
    () =>
      items.filter((statement) => {
        const days = daysUntil(today, statement.due_on);
        return days >= 0 && days <= STATEMENT_NOTICE_DAYS;
      }),
    [items, today],
  );
  // The rate is in the sealed payload; only the statements shown are opened.
  const { contents } = useStatementsContents(dueSoon);
  return useMemo(() => {
    if (loading || !contents || contents.length !== dueSoon.length) return undefined;
    return dueSoon.map((statement, i) => ({
      title: `pago ${FORMAT_LABELS[statement.format].toLowerCase()} · ${formatArsCompact(
        inPesos(statement.total_ars_cents, statement.total_usd_cents, contents[i].usd_rate),
      )}`,
      on: statement.due_on,
      to: `/gastos/${statement.id}`,
      appId: 'gastos',
    }));
  }, [loading, contents, dueSoon]);
}
