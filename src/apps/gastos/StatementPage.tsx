import { useMemo, useRef, useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { useLeave } from '../../hooks/useLeave';
import type { SpendingCategory } from '../../lib/offline/specs';
import { useMasterKey } from '../../hooks/useMasterKey';
import { useEntry } from '../../hooks/useEntry';
import { capitalize } from '../../utils/textUtils';
import { dueWord, formatDateCompact, isPast, todayIso } from '../../utils/dateUtils';
import CheckRow from '../../components/CheckRow';
import DeleteDialog from '../../components/DeleteDialog';
import EntryPage from '../../components/EntryPage';
import ErrorLine from '../../components/ErrorLine';
import IconButton from '../../components/IconButton';
import SectionLabel from '../../components/SectionLabel';
import { useStatements } from './useStatements';
import { useStatementsContents } from './useStatementsContents';
import { useMerchantRules } from './useMerchantRules';
import { useRuleDialog } from './useRuleDialog';
import {
  byCategory,
  isLaterInstallment,
  isOneOff,
  monthOf,
  movementsOf,
  spendParts,
  toPayCents,
  totalCents,
  type Movement,
} from './breakdown';
import { purchaseKey, withOneOff, type StatementContents } from './statement';
import { STATEMENTS_PATH } from './paths';
import {
  FORMAT_LABELS,
  carriedLabel,
  formatArs,
  formatPercentDelta,
  formatUsd,
  monthShort,
  percentDelta,
  periodLabel,
} from './labels';
import Breakdown from './Breakdown';
import BreakdownSkeleton from './BreakdownSkeleton';
import Delta from './Delta';
import MovementList from './MovementList';

export default function StatementPage() {
  const { items, loading, error, replace, setPaid, remove } = useStatements();
  const rulesStore = useMerchantRules();
  const rules = useMemo(() => rulesStore.rules ?? [], [rulesStore.rules]);
  const masterKey = useMasterKey();
  const { select, dialog } = useRuleDialog(rulesStore);
  const leave = useLeave();
  const today = todayIso();
  const [deleting, setDeleting] = useState(false);

  const statement = useEntry(items);
  // The statement before this one of the same card: what "vs." compares with.
  const previous = useMemo(
    () =>
      statement &&
      items
        .filter((s) => s.format === statement.format && s.closed_on < statement.closed_on)
        .sort((a, b) => b.closed_on.localeCompare(a.closed_on))[0],
    [items, statement],
  );
  // Every statement is opened, not only this one: an installment carries the
  // mark of the purchase it belongs to, and that lives on the first
  // installment, in whichever statement first billed it. Opening a statement
  // already open costs nothing.
  const { contents: all, error: openError } = useStatementsContents(items);
  const contents = statement && all ? all[items.indexOf(statement)] : undefined;
  const previousContents = previous && all ? all[items.indexOf(previous)] : undefined;

  /** Whether the purchase behind each first installment is set apart. */
  const purchaseMarks = useMemo(() => {
    const marks = new Map<string, boolean>();
    for (const opened of all ?? [])
      for (const line of opened.lines)
        if (line.installment?.number === 1) marks.set(purchaseKey(line), line.one_off);
    return marks;
  }, [all]);

  // Marking a line rewrites the whole sealed payload, and what is on screen
  // only catches up once the row is written and read again. Each tap waits for
  // the one before it and marks what that one wrote, so no mark is lost.
  const writing = useRef<Promise<StatementContents> | null>(null);

  const movements = useMemo(
    () => (statement && contents ? movementsOf(statement.id, contents) : []),
    [statement, contents],
  );
  const previousByCategory = useMemo(() => {
    const map = new Map<SpendingCategory | null, number>();
    if (previous && previousContents) {
      for (const share of byCategory(movementsOf(previous.id, previousContents), rules))
        map.set(share.category, share.cents);
    }
    return map;
  }, [previous, previousContents, rules]);

  function toggleOneOff(index: number) {
    if (masterKey.status !== 'unlocked' || !statement || !contents) return;
    const { key } = masterKey;
    const id = statement.id;
    const written = (writing.current ?? Promise.resolve(contents)).then(async (current) => {
      const marked = withOneOff(current, index);
      await replace(id, marked, key);
      return marked;
    });
    writing.current = written;
    void written.finally(() => {
      if (writing.current === written) writing.current = null;
    });
  }

  // An installment of an earlier purchase is marked from the month the
  // purchase belongs to, so here its flag is shown and nothing more.
  const markOf = (movement: Movement) => {
    const later = isLaterInstallment(movement.line);
    return {
      marked: later
        ? (purchaseMarks.get(purchaseKey(movement.line)) ?? false)
        : movement.line.one_off,
      onToggle: later ? undefined : () => toggleOneOff(movement.index),
    };
  };

  async function handleRemove() {
    if (!statement) return;
    await remove(statement.id);
    leave(STATEMENTS_PATH);
  }

  // A statement that will not open is said and nothing else.
  if (!contents && openError) return <ErrorLine error={openError} />;

  return (
    <EntryPage
      entry={statement && contents ? { statement, contents } : undefined}
      // A statement whose payload is still being opened is not a statement
      // that is not there. The rules are waited for like the statement is:
      // they decide what each line is filed under and whether it counts as a
      // one-off, so the whole screen would be laid out again a moment after
      // it was drawn.
      loading={
        loading ||
        (statement !== undefined && contents === undefined) ||
        (!rulesStore.rules && !rulesStore.error)
      }
      error={error ?? rulesStore.error}
      skeleton={<BreakdownSkeleton check />}
      missing="Resumen no encontrado."
    >
      {({ statement, contents }) => {
        const toPay = toPayCents(contents);
        const total = totalCents(contents);
        const previousTotal = previousContents ? totalCents(previousContents) : null;
        const sinceLast = previousTotal === null ? null : percentDelta(total, previousTotal);
        const { oneOff, installments } = spendParts(movements, rules);
        // An installment of an earlier purchase is neither this period's usual
        // spending nor a one-off of it; it has a section of its own.
        const oneOffs = movements.filter(
          (movement) => !isLaterInstallment(movement.line) && isOneOff(movement.line, rules),
        );
        const laterInstallments = movements.filter((movement) => isLaterInstallment(movement.line));
        // The due date has passed or it has not, whether or not it was paid;
        // only an unpaid statement past it is a problem.
        const overdue = !statement.paid && isPast(contents.due_on, today);

        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm text-muted">
                  {FORMAT_LABELS[contents.format]} · {periodLabel(contents)}
                </span>
                <span className="font-display text-4xl font-black tracking-tight">
                  {formatArs(toPay, contents.total_usd_cents === 0)}
                </span>
                {contents.total_usd_cents !== 0 && (
                  <span className="text-lg tabular-nums">
                    {formatArs(contents.total_ars_cents, true)} +{' '}
                    {formatUsd(contents.total_usd_cents)}
                  </span>
                )}
                {contents.total_usd_cents !== 0 && contents.usd_rate !== null && (
                  <span className="text-sm text-muted">
                    Total estimado al cambio del resumen (
                    {formatArs(Math.round(contents.usd_rate * 100), true)}).
                  </span>
                )}
                {contents.total_usd_cents !== 0 && contents.usd_rate === null && (
                  <span className="text-sm text-muted">
                    El resumen no dice el cambio; los dólares van aparte.
                  </span>
                )}
                {contents.pending_ars_cents !== 0 && (
                  <span className="text-sm text-muted">
                    {carriedLabel(contents.pending_ars_cents)}
                  </span>
                )}
                {previousContents && sinceLast !== null && (
                  <Delta value={sinceLast} className="mt-1 text-sm">
                    {formatPercentDelta(sinceLast)} vs. {monthShort(monthOf(previousContents))}
                  </Delta>
                )}
              </div>
              <IconButton
                label="Eliminar resumen"
                icon={IconTrash}
                onClick={() => setDeleting(true)}
              />
            </div>

            <CheckRow
              checked={statement.paid}
              onToggle={() => void setPaid(statement.id, !statement.paid)}
              className="w-full border-y border-border py-3"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-on-surface">Pagado</span>
                <span className={`mt-0.5 text-xs ${overdue ? 'text-error' : 'text-muted'}`}>
                  {capitalize(dueWord(contents.due_on, today))} el{' '}
                  {formatDateCompact(contents.due_on)}
                </span>
              </span>
            </CheckRow>

            <Breakdown
              movements={movements}
              rules={rules}
              previousByCategory={previousContents ? previousByCategory : undefined}
              markOf={markOf}
              onSelect={select}
            />

            {oneOffs.length > 0 && (
              <section>
                <SectionLabel detail={formatArs(oneOff)}>Puntuales</SectionLabel>
                <MovementList
                  movements={oneOffs}
                  rules={rules}
                  closed
                  markOf={markOf}
                  onSelect={select}
                />
              </section>
            )}

            {laterInstallments.length > 0 && (
              <section>
                <SectionLabel detail={formatArs(installments)}>
                  Cuotas de meses anteriores
                </SectionLabel>
                <MovementList
                  movements={laterInstallments}
                  rules={rules}
                  closed
                  markOf={markOf}
                  onSelect={select}
                />
              </section>
            )}

            <DeleteDialog
              open={deleting}
              question="¿Eliminar el resumen?"
              onCancel={() => setDeleting(false)}
              onConfirm={() => void handleRemove()}
            />

            {dialog}
          </div>
        );
      }}
    </EntryPage>
  );
}
