import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import type { SpendingCategory } from '../../lib/offline/specs';
import { useMasterKey } from '../../hooks/useMasterKey';
import { useEntry } from '../../hooks/useEntry';
import { capitalize } from '../../utils/textUtils';
import { dueWord, formatDate, isPast, todayIso } from '../../utils/dateUtils';
import CheckRow from '../../components/CheckRow';
import ErrorLine from '../../components/ErrorLine';
import SectionLabel from '../../components/SectionLabel';
import FormFooter from '../../components/FormFooter';
import { useStatements } from './useStatements';
import { useStatementContents } from './useStatementContents';
import { useMerchantRules } from './useMerchantRules';
import {
  byCategory,
  isOneOff,
  isOneOffCategory,
  largestFirst,
  monthOf,
  movementsOf,
  toPayCents,
  totalCents,
  usualAndOneOff,
  type CategoryShare,
  type Movement,
} from './breakdown';
import { categoryOf } from './rules';
import { withOneOff, type StatementContents } from './statement';
import { STATEMENTS_PATH } from './paths';
import {
  CATEGORY_LABELS,
  FORMAT_LABELS,
  UNCATEGORIZED_LABEL,
  carriedLabel,
  formatArs,
  formatArsCompact,
  formatDelta,
  formatPercentDelta,
  formatUsd,
  monthShort,
  percentDelta,
  periodLabel,
} from './labels';
import BreakdownSkeleton from './BreakdownSkeleton';
import SpendBar from './SpendBar';
import SpendLegend from './SpendLegend';
import LineRow from './LineRow';
import Delta from './Delta';
import RuleDialog, { type RuleChange } from './RuleDialog';

/** A category's key in the set of opened ones; the unfiled lines have their own. */
const shareKey = (category: SpendingCategory | null) => category ?? 'none';

export default function StatementPage() {
  const { items, loading, error, replace, setPaid, remove } = useStatements();
  const masterKey = useMasterKey();
  const navigate = useNavigate();
  const today = todayIso();

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
  const { contents, error: openError } = useStatementContents(statement);
  const { contents: previousContents } = useStatementContents(previous);
  const rulesStore = useMerchantRules();
  const rules = useMemo(() => rulesStore.rules ?? [], [rulesStore.rules]);

  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<Movement | null>(null);
  // Marking a line rewrites the whole sealed payload, and what is on screen
  // only catches up once the row is written and read again. Each tap waits for
  // the one before it and marks what that one wrote, so no mark is lost.
  const writing = useRef<Promise<StatementContents> | null>(null);

  const movements = useMemo(
    () => (statement && contents ? movementsOf(statement.id, contents) : []),
    [statement, contents],
  );
  const shares = useMemo(() => byCategory(movements, rules), [movements, rules]);
  const previousByCategory = useMemo(() => {
    const map = new Map<SpendingCategory | null, number>();
    if (previous && previousContents) {
      for (const share of byCategory(movementsOf(previous.id, previousContents), rules))
        map.set(share.category, share.cents);
    }
    return map;
  }, [previous, previousContents, rules]);

  if (loading) return <BreakdownSkeleton check />;
  if (!statement) return <p className="text-muted">Resumen no encontrado.</p>;
  if (!contents && openError) return <ErrorLine error={openError} />;
  // The rules are waited for like the statement is: they decide what each line
  // is filed under and whether it counts as a one-off, so the whole screen
  // would be laid out again a moment after it was drawn.
  if (!contents || (!rulesStore.rules && !rulesStore.error)) return <BreakdownSkeleton check />;

  const toPay = toPayCents(contents);
  const total = totalCents(contents);
  const previousTotal = previousContents ? totalCents(previousContents) : null;
  const sinceLast = previousTotal === null ? null : percentDelta(total, previousTotal);
  const { usual, oneOff } = usualAndOneOff(movements, rules);
  const largestShare = Math.max(...shares.map((s) => s.cents), 1);
  const oneOffs = movements.filter((movement) => isOneOff(movement.line, rules));
  // The due date has passed or it has not, whether or not it was paid; only
  // an unpaid statement past it is a problem.
  const overdue = !statement.paid && isPast(contents.due_on, today);
  const selectedFiling = selected ? categoryOf(selected.line, rules) : null;

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
    if (masterKey.status !== 'unlocked' || selected === null) return;
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

  function toggleOneOff(i: number) {
    if (masterKey.status !== 'unlocked' || !statement || !contents) return;
    const { key } = masterKey;
    const id = statement.id;
    const written = (writing.current ?? Promise.resolve(contents)).then(async (current) => {
      const marked = withOneOff(current, i);
      await replace(id, marked, key);
      return marked;
    });
    writing.current = written;
    void written.finally(() => {
      if (writing.current === written) writing.current = null;
    });
  }

  async function handleRemove() {
    if (!statement) return;
    await remove(statement.id);
    navigate(STATEMENTS_PATH);
  }

  // The movements given, hairlines between them; `closed` draws one under the
  // last too, for a list nothing else closes.
  const renderMovements = (list: Movement[], closed = false) => (
    <ul className={`divide-y divide-border ${closed ? 'border-b border-border' : ''}`}>
      {largestFirst(list).map((movement) => {
        // A line its category already sets apart takes no mark of its own:
        // it is filed differently, not unmarked.
        const fixed = isOneOffCategory(categoryOf(movement.line, rules).category);
        return (
          <LineRow
            key={movement.index}
            line={movement.line}
            cents={movement.cents}
            oneOff={fixed || movement.line.one_off}
            onSelect={() => setSelected(movement)}
            onToggleOneOff={fixed ? undefined : () => toggleOneOff(movement.index)}
          />
        );
      })}
    </ul>
  );

  return (
    <div className="flex flex-col gap-6">
      <ErrorLine error={error ?? rulesStore.error} />

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted">
          {FORMAT_LABELS[contents.format]} · {periodLabel(contents)}
        </span>
        <span className="font-display text-4xl font-black tracking-tight">
          {formatArs(toPay, contents.total_usd_cents === 0)}
        </span>
        {contents.total_usd_cents !== 0 && (
          <span className="text-lg tabular-nums">
            {formatArs(contents.total_ars_cents, true)} + {formatUsd(contents.total_usd_cents)}
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
          <span className="text-sm text-muted">{carriedLabel(contents.pending_ars_cents)}</span>
        )}
        {previousContents && sinceLast !== null && (
          <Delta value={sinceLast} className="mt-1 text-sm">
            {formatPercentDelta(sinceLast)} vs. {monthShort(monthOf(previousContents))}
          </Delta>
        )}
      </div>

      <CheckRow
        checked={statement.paid}
        onToggle={() => void setPaid(statement.id, !statement.paid)}
        className="w-full border-y border-border py-3"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-on-surface">Pagado</span>
          <span className={`mt-0.5 text-xs ${overdue ? 'text-error' : 'text-muted'}`}>
            {capitalize(dueWord(contents.due_on, today))} el {formatDate(contents.due_on)}
          </span>
        </span>
      </CheckRow>

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
                      {previousContents && (
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

      <FormFooter
        removeLabel="Eliminar resumen"
        confirmQuestion="¿Eliminar el resumen?"
        onRemove={() => void handleRemove()}
        action={<span />}
      />

      {selected && selectedFiling && (
        <RuleDialog
          key={selected.index}
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
