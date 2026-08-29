import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconAlertTriangle, IconChevronRight, IconReceipt, IconTags } from '@tabler/icons-react';
import { SPENDING_CATEGORIES } from '../../lib/offline/specs';
import { todayIso } from '../../utils/dateUtils';
import EmptyState from '../../components/EmptyState';
import FormField from '../../components/FormField';
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import Select from '../../components/Select';
import SkeletonRows from '../../components/SkeletonRows';
import { appPath } from '../types';
import SpendBar from './SpendBar';
import SpendLegend from './SpendLegend';
import Delta from './Delta';
import { useStatements } from './useStatements';
import { useStatementsContents } from './useStatementContents';
import { useMerchantRules } from './useMerchantRules';
import { byMonth, type TrendPick } from './breakdown';
import { cardIsShort, coverageByCard, coveredMonths, monthCoverage } from './coverage';
import { monthPath, STATEMENTS_PATH } from './paths';
import {
  CATEGORY_LABELS,
  formatArsCompact,
  formatPercentDelta,
  monthTitle,
  percentDelta,
} from './labels';

/**
 * What Gastos opens on: the household's spending month by calendar month.
 * A movement counts in the month it was made, so a month always holds every
 * card — unlike the bank's closing calendar, which the statements follow and
 * which no two cards share.
 */
export default function MonthsPage() {
  const { items, loading, error } = useStatements();
  const { contents, error: openError } = useStatementsContents(items);
  const { rules } = useMerchantRules();
  const [pick, setPick] = useState<TrendPick>('total');
  const today = todayIso();

  const cards = useMemo(() => (contents ? coverageByCard(contents, today) : []), [contents, today]);

  const months = useMemo(() => {
    if (!contents || !rules) return undefined;
    // Every month the cards cover, whether or not anything was spent in it;
    // a month outside them is left out, since all that is known of it are the
    // installments of its purchases that came in with a later statement.
    const totals = new Map(byMonth(contents, rules, pick).map((row) => [row.month, row]));
    return coveredMonths(cards).map((month) => ({
      ...(totals.get(month) ?? { month, cents: 0, usual: 0, oneOff: 0 }),
      coverage: monthCoverage(month, cards),
    }));
  }, [contents, rules, pick, cards]);

  const largest = Math.max(...(months ?? []).map((row) => row.cents), 1);
  const short = cards.some(cardIsShort);

  return (
    <ListPage
      // A statement that will not open is said so and nothing else: the months
      // it would have counted are never coming.
      loading={!openError && (loading || !months)}
      error={error ?? openError}
      skeleton={<SkeletonRows subtitle />}
    >
      <ul>
        <LinkRow
          to={STATEMENTS_PATH}
          title="Resúmenes"
          leading={<IconReceipt size={20} stroke={1.75} className="shrink-0 text-(--app)" />}
          trailing={
            short ? (
              <span
                role="img"
                aria-label="Falta un resumen"
                title="Falta un resumen"
                className="flex shrink-0 text-warning"
              >
                <IconAlertTriangle size={18} stroke={1.75} />
              </span>
            ) : undefined
          }
          chevron
        />
        <LinkRow
          to={`${appPath('gastos')}/categorizacion`}
          title="Categorización"
          leading={<IconTags size={20} stroke={1.75} className="shrink-0 text-(--app)" />}
          chevron
        />
      </ul>

      {!months ? null : months.length === 0 ? (
        <EmptyState>Todavía no hay resúmenes. Importá el PDF que manda el banco.</EmptyState>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          <FormField label="Qué mirar">
            <Select
              value={pick}
              onChange={(e) => setPick(e.target.value as TrendPick)}
              aria-label="Qué mirar"
            >
              <option value="total">Total</option>
              <option value="usual">Base (sin puntuales)</option>
              {SPENDING_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </Select>
          </FormField>

          <SpendLegend />

          <ul>
            {months.map((row, i) => {
              const older = months[i + 1];
              // Half a month against a whole one is not a comparison, and
              // nothing is ever guessed for the days no statement covers.
              const change =
                row.coverage.whole && older?.coverage.whole
                  ? percentDelta(row.cents, older.cents)
                  : null;
              return (
                <li key={row.month} className="border-b border-border">
                  <Link
                    to={monthPath(row.month)}
                    className="flex items-center gap-1 py-2.5 transition-colors hover:bg-border-subtle"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-sm">{monthTitle(row.month)}</span>
                        <span className="shrink-0 text-sm tabular-nums">
                          {formatArsCompact(row.cents)}
                        </span>
                      </span>
                      <SpendBar usual={row.usual} oneOff={row.oneOff} max={largest} />
                    </span>
                    {change === null ? (
                      <span className="w-14 shrink-0 text-right text-xs text-muted">—</span>
                    ) : (
                      <Delta value={change} className="w-14 shrink-0 text-right text-xs">
                        {formatPercentDelta(change)}
                      </Delta>
                    )}
                    <IconChevronRight size={18} stroke={1.5} className="shrink-0 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </ListPage>
  );
}
