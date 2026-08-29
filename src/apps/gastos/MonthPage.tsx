import { useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import type { SpendingCategory } from '../../lib/offline/specs';
import { useMasterKey } from '../../hooks/useMasterKey';
import { monthName, todayIso } from '../../utils/dateUtils';
import EntryPage from '../../components/EntryPage';
import ErrorLine from '../../components/ErrorLine';
import LinkRow from '../../components/LinkRow';
import SectionLabel from '../../components/SectionLabel';
import { useStatements } from './useStatements';
import { useStatementsContents } from './useStatementsContents';
import { useMerchantRules } from './useMerchantRules';
import { useRuleDialog } from './useRuleDialog';
import {
  byCategory,
  byMonth,
  isOneOff,
  movementsOfMonth,
  spendParts,
  sumCents,
  type Movement,
} from './breakdown';
import { coverageByCard, coveredMonths, monthCoverage } from './coverage';
import { withOneOff, type StatementContents } from './statement';
import { statementPath } from './paths';
import {
  formatArs,
  formatPercentDelta,
  monthShort,
  monthTitle,
  percentDelta,
  shortfallLabel,
  statementTitle,
} from './labels';
import Breakdown from './Breakdown';
import BreakdownSkeleton from './BreakdownSkeleton';
import CardMark from './CardMark';
import Delta from './Delta';
import MovementList from './MovementList';

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
  const { select, dialog } = useRuleDialog(rulesStore);
  const month = useParams().month ?? '';
  const today = todayIso();

  // Marking a movement rewrites the whole sealed payload of the statement it
  // is in, and what is on screen only catches up once that row is written and
  // read again. Each tap waits for the one before it on the same statement and
  // marks what that one wrote, so no mark is lost.
  const writing = useRef(new Map<string, Promise<StatementContents>>());

  const movements = useMemo(
    () => (contents ? movementsOfMonth(items, contents, month) : []),
    [items, contents, month],
  );

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

  const markOf = (movement: Movement) => ({
    marked: movement.line.one_off,
    onToggle: () => toggleOneOff(movement),
  });

  // A statement that will not open is said and nothing else: the months it
  // would have counted are never coming.
  if (!contents && openError) return <ErrorLine error={openError} />;

  return (
    <EntryPage
      entry={contents && listed ? { month, contents } : undefined}
      // The rules are waited for like the statements are: they decide what
      // each movement is filed under and whether it counts as a one-off, so
      // the whole screen would be laid out again a moment after it was drawn.
      loading={loading || !contents || (!rulesStore.rules && !rulesStore.error)}
      error={error ?? rulesStore.error}
      skeleton={<BreakdownSkeleton />}
      missing="Mes no encontrado."
    >
      {({ contents }) => {
        const total = sumCents(movements);
        const monthChange = comparable ? percentDelta(total, previousCents) : null;
        const { oneOff } = spendParts(movements, rules);
        const oneOffs = movements.filter((movement) => isOneOff(movement.line, rules));
        // The statements a movement of this month came in, newest first: a
        // month is rarely one statement, and never the same days as one.
        const sources = items
          .map((statement, i) => ({
            statement,
            contents: contents[i],
            movements: movements.filter((movement) => movement.statementId === statement.id),
          }))
          .filter((source) => source.movements.length > 0);

        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-muted">{monthTitle(month)}</span>
              <span className="font-display text-4xl font-black tracking-tight">
                {formatArs(total)}
              </span>
              {monthChange !== null && previousMonth && (
                <Delta value={monthChange} className="mt-1 text-sm">
                  {formatPercentDelta(monthChange)} vs. {monthShort(previousMonth)}
                </Delta>
              )}
              {!coverage.whole && (
                <span className="mt-1 text-sm text-muted">
                  {shortfallLabel(coverage.short, month)}
                </span>
              )}
            </div>

            <Breakdown
              movements={movements}
              rules={rules}
              previousByCategory={previousMonth ? previousByCategory : undefined}
              whole
              markOf={markOf}
              onSelect={select}
            />

            {oneOffs.length > 0 && (
              <section>
                <SectionLabel detail={formatArs(oneOff)}>Puntuales</SectionLabel>
                <MovementList
                  movements={oneOffs}
                  rules={rules}
                  whole
                  closed
                  markOf={markOf}
                  onSelect={select}
                />
              </section>
            )}

            {sources.length > 0 && (
              <section>
                <SectionLabel>De qué resúmenes sale</SectionLabel>
                <ul>
                  {sources.map((source) => (
                    <LinkRow
                      key={source.statement.id}
                      to={statementPath(source.statement.id)}
                      title={statementTitle(source.contents)}
                      leading={<CardMark format={source.statement.format} />}
                      subtitle={`${source.movements.length} movimientos de ${monthName(month, 'long')} · ${formatArs(
                        sumCents(source.movements),
                      )}`}
                      chevron
                    />
                  ))}
                </ul>
              </section>
            )}

            {dialog}
          </div>
        );
      }}
    </EntryPage>
  );
}
