import { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import type { SpendingCategory } from '../../lib/offline/specs';
import { useMasterKey } from '../../hooks/useMasterKey';
import { monthName, todayIso } from '../../utils/dateUtils';
import ErrorLine from '../../components/ErrorLine';
import LinkRow from '../../components/LinkRow';
import SectionLabel from '../../components/SectionLabel';
import { useStatements } from './useStatements';
import { useStatementsContents } from './useStatementContents';
import { useMerchantRules } from './useMerchantRules';
import {
  byCategory,
  byMonth,
  isOneOff,
  isOneOffCategory,
  largestFirst,
  movementsOfMonth,
  sumCents,
  usualAndOneOff,
  type CategoryShare,
  type Movement,
} from './breakdown';
import { coverageByCard, coveredMonths, monthCoverage } from './coverage';
import { categoryOf } from './rules';
import { withOneOff, type StatementContents } from './statement';
import { statementPath } from './paths';
import {
  CATEGORY_LABELS,
  UNCATEGORIZED_LABEL,
  formatArs,
  formatArsCompact,
  formatDelta,
  formatPercentDelta,
  monthShort,
  monthTitle,
  percentDelta,
  shortfallLabel,
  statementTitle,
} from './labels';
import BreakdownSkeleton from './BreakdownSkeleton';
import SpendBar from './SpendBar';
import SpendLegend from './SpendLegend';
import LineRow from './LineRow';
import Delta from './Delta';
import RuleDialog, { type RuleChange } from './RuleDialog';

/** A category's key in the set of opened ones; the unfiled lines have their own. */
const shareKey = (category: SpendingCategory | null) => category ?? 'none';

/**
 * One calendar month: what the household spent in it, wherever the bank
 * happened to bill it. The statements it is made of are listed at the end,
 * because a month and a statement almost never line up.
 */
export default function MonthPage() {
  const { items, loading, error, replace } = useStatements();
  const { contents, error: openError } = useStatementsContents(items);
  const rulesStore = useMerchantRules();
  const rules = useMemo(() => rulesStore.rules ?? [], [rulesStore.rules]);
  const masterKey = useMasterKey();
  const month = useParams().month ?? '';
  const today = todayIso();

  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<Movement | null>(null);
  // Marking a movement rewrites the whole sealed payload of the statement it
  // is in, and what is on screen only catches up once that row is written and
  // read again. Each tap waits for the one before it on the same statement and
  // marks what that one wrote, so no mark is lost.
  const writing = useRef(new Map<string, Promise<StatementContents>>());

  const movements = useMemo(
    () => (contents ? movementsOfMonth(items, contents, month) : []),
    [items, contents, month],
  );
  const shares = useMemo(() => byCategory(movements, rules), [movements, rules]);

  const cards = useMemo(() => (contents ? coverageByCard(contents, today) : []), [contents, today]);
  const coverage = useMemo(() => monthCoverage(month, cards), [month, cards]);
  // A month no statement covers a day of is not a month the app has.
  const listed = useMemo(() => coveredMonths(cards).includes(month), [cards, month]);

  // The month before this one, to compare with — and only when both are whole.
  const { previousMonth, previousCents, comparable } = useMemo(() => {
    if (!contents) return { previousMonth: null, previousCents: 0, comparable: false };
    const months = coveredMonths(cards);
    const older = months[months.indexOf(month) + 1] ?? null;
    const totals = new Map(byMonth(contents, rules, 'total').map((row) => [row.month, row.cents]));
    return {
      previousMonth: older,
      previousCents: older ? (totals.get(older) ?? 0) : 0,
      comparable:
        older !== null && monthCoverage(month, cards).whole && monthCoverage(older, cards).whole,
    };
  }, [contents, rules, month, cards]);

  const previousByCategory = useMemo(() => {
    const map = new Map<SpendingCategory | null, number>();
    if (contents && previousMonth) {
      for (const share of byCategory(movementsOfMonth(items, contents, previousMonth), rules))
        map.set(share.category, share.cents);
    }
    return map;
  }, [items, contents, previousMonth, rules]);

  if (!contents && openError) return <ErrorLine error={openError} />;
  // The rules are waited for like the statements are: they decide what each
  // movement is filed under and whether it counts as a one-off, so the whole
  // screen would be laid out again a moment after it was drawn.
  if (loading || !contents || (!rulesStore.rules && !rulesStore.error))
    return <BreakdownSkeleton />;
  if (!listed) return <p className="text-muted">Mes no encontrado.</p>;

  const total = sumCents(movements);
  const monthChange = comparable ? percentDelta(total, previousCents) : null;
  const { usual, oneOff } = usualAndOneOff(movements, rules);
  const largestShare = Math.max(...shares.map((share) => share.cents), 1);
  const selectedFiling = selected ? categoryOf(selected.line, rules) : null;

  // The statements a movement of this month came in, newest first: a month is
  // rarely one statement, and never the same days as one.
  const sources = items
    .map((statement, i) => ({
      statement,
      contents: contents[i],
      movements: movements.filter((movement) => movement.statementId === statement.id),
    }))
    .filter((source) => source.movements.length > 0);

  function toggle(share: CategoryShare) {
    setOpened((prev) => {
      const next = new Set(prev);
      const key = shareKey(share.category);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSave(change: RuleChange | 'remove' | null) {
    if (masterKey.status !== 'unlocked' || !selected) return;
    const { rule } = categoryOf(selected.line, rules);
    if (change === 'remove') {
      if (rule) await rulesStore.remove(rule.id);
    } else if (change && rule) {
      await rulesStore.save(rule.id, change, masterKey.key);
    } else if (change) {
      await rulesStore.add(change.pattern, change.category, masterKey.key);
    }
    setSelected(null);
  }

  function toggleOneOff(movement: Movement) {
    if (masterKey.status !== 'unlocked' || !contents) return;
    const { key } = masterKey;
    const at = items.findIndex((statement) => statement.id === movement.statementId);
    if (at < 0) return;
    const { statementId } = movement;
    const pending = writing.current.get(statementId) ?? Promise.resolve(contents[at]);
    const written = pending.then(async (current) => {
      const marked = withOneOff(current, movement.index);
      await replace(statementId, marked, key);
      return marked;
    });
    writing.current.set(statementId, written);
    void written.finally(() => {
      if (writing.current.get(statementId) === written) writing.current.delete(statementId);
    });
  }

  const renderMovements = (list: Movement[], closed = false) => (
    <ul className={`divide-y divide-border ${closed ? 'border-b border-border' : ''}`}>
      {largestFirst(list).map((movement) => {
        // A line its category already sets apart takes no mark of its own:
        // it is filed differently, not unmarked.
        const fixed = isOneOffCategory(categoryOf(movement.line, rules).category);
        return (
          <LineRow
            key={`${movement.statementId}-${movement.index}`}
            line={movement.line}
            cents={movement.cents}
            oneOff={fixed || movement.line.one_off}
            onSelect={() => setSelected(movement)}
            onToggleOneOff={fixed ? undefined : () => toggleOneOff(movement)}
          />
        );
      })}
    </ul>
  );

  const oneOffs = movements.filter((movement) => isOneOff(movement.line, rules));

  return (
    <div className="flex flex-col gap-6">
      <ErrorLine error={error ?? rulesStore.error} />

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted">{monthTitle(month)}</span>
        <span className="font-display text-4xl font-black tracking-tight">{formatArs(total)}</span>
        {monthChange !== null && previousMonth && (
          <Delta value={monthChange} className="mt-1 text-sm">
            {formatPercentDelta(monthChange)} vs. {monthShort(previousMonth)}
          </Delta>
        )}
        {!coverage.whole && (
          <span className="mt-1 text-sm text-muted">{shortfallLabel(coverage.short, month)}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <SpendBar usual={usual} oneOff={oneOff} max={usual + oneOff} size="md" />
        <SpendLegend
          usual={formatArs(usual)}
          oneOff={formatArs(oneOff)}
          className="flex justify-between gap-3"
        />
      </div>

      <section>
        <SectionLabel>Por categoría</SectionLabel>
        <ul>
          {shares.map((share) => {
            const key = shareKey(share.category);
            const open = opened.has(key);
            const change = share.cents - (previousByCategory.get(share.category) ?? 0);
            const Chevron = open ? IconChevronDown : IconChevronRight;
            return (
              <li key={key} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => toggle(share)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-border-subtle"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-on-surface">
                        {share.category ? CATEGORY_LABELS[share.category] : UNCATEGORIZED_LABEL}{' '}
                        <span className="text-xs text-muted">{share.movements.length}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">{formatArsCompact(share.cents)}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <SpendBar usual={share.cents} max={largestShare} />
                      {previousMonth && (
                        <Delta value={change} className="w-24 shrink-0 text-right text-xs">
                          {formatDelta(change)}
                        </Delta>
                      )}
                    </span>
                  </span>
                  <Chevron size={18} stroke={1.5} className="shrink-0 text-muted" />
                </button>
                {open && <div className="pb-1 pl-3">{renderMovements(share.movements)}</div>}
              </li>
            );
          })}
        </ul>
      </section>

      {oneOffs.length > 0 && (
        <section>
          <SectionLabel detail={formatArs(oneOff)}>Puntuales</SectionLabel>
          {renderMovements(oneOffs, true)}
        </section>
      )}

      {sources.length > 0 && (
        <section>
          <SectionLabel>De qué resúmenes sale</SectionLabel>
          <ul>
            {sources.map((source) => {
              const cuotas = source.movements.every((movement) => movement.line.installment);
              const what = cuotas ? 'cuotas de compras' : 'movimientos';
              return (
                <LinkRow
                  key={source.statement.id}
                  to={statementPath(source.statement.id)}
                  title={statementTitle(source.contents)}
                  subtitle={`${source.movements.length} ${what} de ${monthName(month, 'long')} · ${formatArs(
                    sumCents(source.movements),
                  )}`}
                  chevron
                />
              );
            })}
          </ul>
        </section>
      )}

      {selected && selectedFiling && (
        <RuleDialog
          key={`${selected.statementId}-${selected.index}`}
          line={selected.line}
          cents={selected.cents}
          rule={selectedFiling.rule}
          category={selectedFiling.category}
          onSave={(change) => void handleSave(change)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
