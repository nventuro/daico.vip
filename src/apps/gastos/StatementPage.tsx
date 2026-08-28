import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import type { SpendingCategory } from '../../types';
import { useMasterKey } from '../../hooks/useMasterKey';
import { formatDate, todayIso } from '../../utils/dateUtils';
import SkeletonRows from '../../components/SkeletonRows';
import SectionLabel from '../../components/SectionLabel';
import FormFooter from '../../components/FormFooter';
import CheckSquare from '../../components/CheckSquare';
import { useStatements } from './useStatements';
import { useStatementContents } from './useStatementContents';
import { useMerchantRules } from './useMerchantRules';
import {
  byCategory,
  isOneOff,
  isOneOffCategory,
  largestFirst,
  lineCents,
  monthOf,
  toPayCents,
  totalCents,
  usualAndOneOff,
  type CategoryShare,
} from './breakdown';
import { categoryOf } from './rules';
import { withOneOff, type StatementContents } from './statement';
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
  periodLabel,
} from './labels';
import SpendBar from './SpendBar';
import LineRow from './LineRow';
import Delta from './Delta';
import RuleDialog, { type RuleChange } from './RuleDialog';

/** A category's key in the set of opened ones; the unfiled lines have their own. */
const shareKey = (category: SpendingCategory | null) => category ?? 'none';

export default function StatementPage() {
  const { id } = useParams();
  const { items, loading, error, replace, setPaid, remove } = useStatements();
  const masterKey = useMasterKey();
  const navigate = useNavigate();
  const today = todayIso();

  const statement = items.find((s) => s.id === id);
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
  const [selected, setSelected] = useState<number | null>(null);
  // Marking a line rewrites the whole sealed payload, and what is on screen
  // only catches up once the row is written and read again. Each tap waits for
  // the one before it and marks what that one wrote, so no mark is lost.
  const writing = useRef<Promise<StatementContents> | null>(null);

  const shares = useMemo(() => (contents ? byCategory(contents, rules) : []), [contents, rules]);
  const previousByCategory = useMemo(() => {
    const map = new Map<SpendingCategory | null, number>();
    if (previousContents) {
      for (const share of byCategory(previousContents, rules)) map.set(share.category, share.cents);
    }
    return map;
  }, [previousContents, rules]);

  if (loading || (statement && !contents && !openError)) return <SkeletonRows />;
  if (!statement) return <p className="text-muted">Resumen no encontrado.</p>;
  if (!contents) return <p className="text-sm text-error">Error: {openError}</p>;

  const toPay = toPayCents(contents);
  const total = totalCents(contents);
  const previousTotal = previousContents ? totalCents(previousContents) : null;
  const { usual, oneOff } = usualAndOneOff(contents, rules);
  const largestShare = Math.max(...shares.map((s) => s.cents), 1);
  const oneOffs = contents.lines.flatMap((line, i) => (isOneOff(line, rules) ? [i] : []));
  // The due date has passed or it has not, whether or not it was paid; only
  // an unpaid statement past it is a problem.
  const expired = contents.due_on < today;
  const overdue = !statement.paid && expired;
  const cents = (i: number) => lineCents(contents.lines[i], contents.usd_rate);
  const selectedLine = selected === null ? null : contents.lines[selected];
  const selectedFiling = selectedLine ? categoryOf(selectedLine, rules) : null;

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
    if (masterKey.status !== 'unlocked' || !statement || !contents || selected === null) return;
    const { rule } = categoryOf(contents.lines[selected], rules);
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
    await remove(statement);
    navigate('/gastos');
  }

  // The lines `indices` name, hairlines between them; `closed` draws one
  // under the last too, for a list nothing else closes.
  const renderLines = (indices: number[], closed = false) => (
    <ul className={`divide-y divide-border ${closed ? 'border-b border-border' : ''}`}>
      {largestFirst(contents, indices).map((i) => {
        // A line its category already sets apart takes no mark of its own:
        // it is filed differently, not unmarked.
        const fixed = isOneOffCategory(categoryOf(contents.lines[i], rules).category);
        return (
          <LineRow
            key={i}
            line={contents.lines[i]}
            cents={cents(i)}
            oneOff={fixed || contents.lines[i].one_off}
            onSelect={() => setSelected(i)}
            onToggleOneOff={fixed ? undefined : () => toggleOneOff(i)}
          />
        );
      })}
    </ul>
  );

  return (
    <div className="flex flex-col gap-6">
      {(error || rulesStore.error) && (
        <p className="text-sm text-error">Error: {error ?? rulesStore.error}</p>
      )}

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
        {previousContents && previousTotal !== null && previousTotal !== 0 && (
          <Delta value={total - previousTotal} className="mt-1 text-sm">
            {formatPercentDelta(total, previousTotal)} vs. {monthShort(monthOf(previousContents))}
          </Delta>
        )}
      </div>

      <button
        type="button"
        onClick={() => void setPaid(statement.id, !statement.paid)}
        aria-pressed={statement.paid}
        className="flex w-full items-center gap-3 border-y border-border py-3 text-left"
      >
        <CheckSquare checked={statement.paid} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-on-surface">Pagado</span>
          <span className={`mt-0.5 text-xs ${overdue ? 'text-error' : 'text-muted'}`}>
            {expired ? 'Venció' : 'Vence'} el {formatDate(contents.due_on)}
          </span>
        </span>
      </button>

      <div className="flex flex-col gap-2">
        <SpendBar usual={usual} oneOff={oneOff} max={usual + oneOff} size="md" />
        <div className="flex justify-between gap-3 text-sm">
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 bg-(--app)" />
            Base <span className="tabular-nums">{formatArs(usual)}</span>
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 bg-(--app) opacity-40" />
            Puntual <span className="tabular-nums">{formatArs(oneOff)}</span>
          </span>
        </div>
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
                        <span className="text-xs text-muted">{share.lines.length}</span>
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
                {open && <div className="pb-1 pl-3">{renderLines(share.lines)}</div>}
              </li>
            );
          })}
        </ul>
      </section>

      {oneOffs.length > 0 && (
        <section>
          <SectionLabel>
            Puntuales{' '}
            <span className="font-normal tracking-normal normal-case">· {formatArs(oneOff)}</span>
          </SectionLabel>
          {renderLines(oneOffs, true)}
        </section>
      )}

      <FormFooter
        removeLabel="Eliminar resumen"
        confirmQuestion="¿Eliminar el resumen?"
        onRemove={() => void handleRemove()}
        action={<span />}
      />

      {selectedLine && selectedFiling && selected !== null && (
        <RuleDialog
          key={selected}
          line={selectedLine}
          cents={cents(selected)}
          rule={selectedFiling.rule}
          category={selectedFiling.category}
          onSave={(change) => void handleSave(change)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
