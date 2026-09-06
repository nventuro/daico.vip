import { useMemo } from 'react';
import type { Upcoming } from '../types';
import { addDays } from '../../utils/dateUtils';
import { STATEMENTS_PATH, statementPath } from './paths';
import { useStatements } from './useStatements';
import { useStatementsContents } from './useStatementsContents';
import { toPayCents } from './breakdown';
import { CARD_LATE_DAYS, cardCloses } from './coverage';
import { FORMAT_LABELS, formatArsCompact } from './labels';
import { useToday } from '../../hooks/useToday';

/** What Gastos puts on the home screen: the statements still to be paid,
 *  however far off they are due — each as one amount in pesos, the dollars
 *  valued at the statement's own rate — and the statement that should have
 *  come in by now and has not, dated the day it was due to arrive.
 *
 *  A statement that has not been imported is the one thing here that is not
 *  an entry, and it is the one worth saying loudest: nothing else in the app
 *  knows what is being spent until it is in. */
export function useStatementsUpcoming(): Upcoming[] | undefined {
  const { items, loading } = useStatements();
  const today = useToday();
  const unpaid = useMemo(() => items.filter((statement) => !statement.paid), [items]);
  // The rate is in the sealed payload; only the statements shown are opened.
  const { contents } = useStatementsContents(unpaid);
  return useMemo(() => {
    if (loading || !contents || unpaid.some((statement) => !contents.has(statement.id))) {
      return undefined;
    }
    const missing = cardCloses(items, today)
      .filter((card) => card.late)
      .map((card) => ({
        title: `Subir resumen de ${FORMAT_LABELS[card.format]}`,
        on: addDays(card.lastClosedOn, CARD_LATE_DAYS),
        to: STATEMENTS_PATH,
        appId: 'gastos' as const,
      }));
    const toPay = unpaid.map((statement) => ({
      title: `${FORMAT_LABELS[statement.format]} · ${formatArsCompact(
        toPayCents({ ...statement, usd_rate: contents.get(statement.id)?.usd_rate ?? null }),
      )}`,
      on: statement.due_on,
      to: statementPath(statement.id),
      appId: 'gastos' as const,
    }));
    return [...missing, ...toPay];
  }, [loading, contents, items, unpaid, today]);
}
