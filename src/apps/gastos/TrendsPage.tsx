import { useMemo, useState } from 'react';
import { SPENDING_CATEGORIES, type StatementFormat } from '../../types';
import SkeletonRows from '../../components/SkeletonRows';
import FormField from '../../components/FormField';
import { CONTROL_CLASS } from '../../components/controlClasses';
import { useStatements } from './useStatements';
import { useStatementsContents } from './useStatementContents';
import { useMerchantRules } from './useMerchantRules';
import { byMonth, type TrendPick } from './breakdown';
import {
  CATEGORY_LABELS,
  FORMAT_LABELS,
  formatArsCompact,
  formatPercentDelta,
  monthTitle,
} from './labels';
import SpendBar from './SpendBar';
import Delta from './Delta';

export default function TrendsPage() {
  const { items, loading, error } = useStatements();
  const { contents, error: openError } = useStatementsContents(items);
  const { rules } = useMerchantRules();
  const [pick, setPick] = useState<TrendPick>('total');

  const months = useMemo(
    () => (contents && rules ? byMonth(contents, rules, pick) : undefined),
    [contents, rules, pick],
  );
  // A month missing one of the cards the household has is said so, or its
  // total would read as a drop.
  const formats = useMemo(() => {
    const all = new Set<StatementFormat>();
    for (const c of contents ?? []) all.add(c.format);
    return all;
  }, [contents]);

  if (error || openError) return <p className="text-sm text-error">Error: {error ?? openError}</p>;
  if (loading || !months) return <SkeletonRows subtitle />;
  if (months.length === 0) {
    return <p className="py-10 text-center text-muted">Todavía no hay resúmenes.</p>;
  }

  const largest = Math.max(...months.map((m) => m.cents), 1);

  return (
    <div className="flex flex-col gap-3">
      <FormField label="Qué mirar">
        <select
          value={pick}
          onChange={(e) => setPick(e.target.value as TrendPick)}
          aria-label="Qué mirar"
          className={CONTROL_CLASS}
        >
          <option value="total">Total</option>
          <option value="usual">Base (sin puntuales)</option>
          {SPENDING_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </FormField>

      <div className="flex flex-col gap-1 text-sm">
        <div className="flex gap-4">
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 bg-(--app)" />
            Base
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 bg-(--app) opacity-40" />
            Puntual
          </span>
        </div>
        <p className="text-xs text-muted">
          En pesos, con los dólares al cambio de cada resumen. Un mes suma todos sus resúmenes.
        </p>
      </div>

      <ul>
        {months.map((row, i) => {
          const older = months[i + 1];
          const missing = row.formats.length < formats.size;
          return (
            <li key={row.month} className="flex flex-col gap-1.5 border-b border-border py-2">
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-sm">
                  {monthTitle(row.month)}
                  {missing && (
                    <span className="text-xs text-muted">
                      {' '}
                      · solo {row.formats.map((f) => FORMAT_LABELS[f]).join(' y ')}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm tabular-nums">{formatArsCompact(row.cents)}</span>
              </span>
              <span className="flex items-center gap-3">
                <SpendBar usual={row.usual} oneOff={row.oneOff} max={largest} size="md" />
                <Delta
                  value={older ? row.cents - older.cents : 0}
                  className="w-14 shrink-0 text-right text-xs"
                >
                  {older ? formatPercentDelta(row.cents, older.cents) : ''}
                </Delta>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
