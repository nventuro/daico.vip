import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import type { SpendingCategory } from '../../types';
import { useMasterKey } from '../../hooks/useMasterKey';
import { formatDateShort, relativeDay, todayIso } from '../../utils/dateUtils';
import { countLabel } from '../../utils/textUtils';
import SkeletonRows from '../../components/SkeletonRows';
import SectionLabel from '../../components/SectionLabel';
import FormFooter from '../../components/FormFooter';
import { useStatements } from './useStatements';
import { useStatementContents } from './useStatementContents';
import { useMerchantRules } from './useMerchantRules';
import {
  byCategory,
  byHolder,
  installmentLines,
  lineCents,
  monthOf,
  totalCents,
  usualAndOneOff,
  type CategoryShare,
} from './breakdown';
import { categoryOf } from './rules';
import {
  CATEGORY_LABELS,
  FORMAT_LABELS,
  UNCATEGORIZED_LABEL,
  formatArs,
  formatDelta,
  formatPercentDelta,
  formatUsd,
  monthShort,
} from './labels';
import type { StatementContents } from './statement';
import SpendBar from './SpendBar';
import LineRow from './LineRow';
import RuleDialog, { type RuleChange } from './RuleDialog';

/** A category's key in the set of opened ones; the unfiled lines have their own. */
const shareKey = (category: SpendingCategory | null) => category ?? 'none';

function last4Of(contents: StatementContents, holder: string | null): string | null {
  return contents.holders.find((h) => h.holder === holder)?.last4 ?? null;
}

export default function StatementPage() {
  const { id } = useParams();
  const { items, loading, error, replace, remove } = useStatements();
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

  const shares = useMemo(() => {
    if (!contents) return [];
    const all = byCategory(contents, rules);
    // What is not filed yet comes first: it is what needs a hand.
    return [...all.filter((s) => s.category === null), ...all.filter((s) => s.category !== null)];
  }, [contents, rules]);
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

  const total = totalCents(contents);
  const previousTotal = previousContents ? totalCents(previousContents) : null;
  const { usual, oneOff } = usualAndOneOff(contents);
  const holders = byHolder(contents);
  const largestShare = Math.max(...shares.map((s) => s.cents), 1);
  const largestHolder = Math.max(...holders.map((h) => h.cents), 1);
  const oneOffs = contents.lines.flatMap((line, i) => (line.one_off ? [i] : []));
  const installments = installmentLines(contents);
  const installmentsTotal = installments.reduce(
    (acc, i) => acc + lineCents(contents.lines[i], contents.usd_rate),
    0,
  );
  const largestDue = Math.max(...contents.installments_due.map((d) => d.ars_cents), 1);
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

  async function handleSave(change: RuleChange | null, oneOff: boolean) {
    if (masterKey.status !== 'unlocked' || !statement || !contents || selected === null) return;
    const line = contents.lines[selected];
    const { rule } = categoryOf(line, rules);
    if (change && rule) {
      await rulesStore.save(rule.id, change, masterKey.key);
    } else if (change) {
      await rulesStore.add(change.pattern, change.category, masterKey.key);
    }
    if (oneOff !== line.one_off) {
      const lines = contents.lines.map((l, i) => (i === selected ? { ...l, one_off: oneOff } : l));
      await replace(statement.id, { ...contents, lines }, masterKey.key);
    }
    setSelected(null);
  }

  async function handleRemoveRule() {
    if (!contents || selected === null) return;
    const { rule } = categoryOf(contents.lines[selected], rules);
    if (rule) await rulesStore.remove(rule.id);
    setSelected(null);
  }

  async function handleRemove() {
    if (!statement) return;
    await remove(statement);
    navigate('/gastos');
  }

  const renderLines = (indices: number[]) => (
    <ul>
      {indices.map((i) => (
        <LineRow
          key={i}
          line={contents.lines[i]}
          last4={last4Of(contents, contents.lines[i].holder)}
          cents={cents(i)}
          onSelect={() => setSelected(i)}
        />
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-6">
      {(error || rulesStore.error) && (
        <p className="text-sm text-error">Error: {error ?? rulesStore.error}</p>
      )}

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted">
          {FORMAT_LABELS[contents.format]} · cierre {formatDateShort(contents.closed_on)}
        </span>
        <span className="font-display text-4xl font-black tracking-tight">
          {formatArs(contents.total_ars_cents, true)}
        </span>
        {contents.total_usd_cents !== 0 && (
          <span className="text-xl font-medium">+ {formatUsd(contents.total_usd_cents)}</span>
        )}
        {contents.total_usd_cents !== 0 && contents.usd_rate !== null && (
          <span className="text-sm text-muted">
            ≈ {formatArs(total)} en total, al cambio del resumen (
            {formatArs(Math.round(contents.usd_rate * 100), true)})
          </span>
        )}
        {contents.total_usd_cents !== 0 && contents.usd_rate === null && (
          <span className="text-sm text-muted">
            El resumen no dice el cambio; los dólares van aparte.
          </span>
        )}
        {contents.pending_ars_cents !== 0 && (
          <span className="text-sm text-muted">
            Incluye {formatArs(contents.pending_ars_cents)} pendientes del resumen anterior.
          </span>
        )}
        <div className="mt-2 flex items-baseline justify-between gap-3 text-sm">
          <span>
            Vence <span className="font-medium">{relativeDay(today, contents.due_on)}</span>
          </span>
          {previousContents && previousTotal !== null && (
            <span className="text-error tabular-nums">
              {formatPercentDelta(total, previousTotal)} vs. {monthShort(monthOf(previousContents))}
            </span>
          )}
        </div>
      </div>

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
            const before = previousByCategory.get(share.category);
            const Chevron = open ? IconChevronDown : IconChevronRight;
            return (
              <li key={key} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => toggle(share)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-border-subtle"
                >
                  {share.category === null && (
                    <span aria-hidden className="size-3 shrink-0 bg-warning" />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-on-surface">
                        {share.category ? CATEGORY_LABELS[share.category] : UNCATEGORIZED_LABEL}{' '}
                        <span className="text-xs text-muted">{share.lines.length}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">{formatArs(share.cents)}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <SpendBar usual={share.cents} max={largestShare} />
                      {previousContents && (
                        <span className="w-24 shrink-0 text-right text-xs text-muted tabular-nums">
                          {formatDelta(share.cents - (before ?? 0))}
                        </span>
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
          {renderLines(oneOffs)}
        </section>
      )}

      <section>
        <SectionLabel>Por titular</SectionLabel>
        <ul>
          {holders.map((row) => (
            <li
              key={row.holder ?? 'bank'}
              className="flex items-center gap-3 border-b border-border py-2.5"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span
                  className={`truncate ${row.holder === null ? 'text-muted' : 'text-on-surface'}`}
                >
                  {row.holder ?? 'Percepciones del banco'}
                  {row.last4 && <span className="text-muted"> · …{row.last4}</span>}
                </span>
                <SpendBar usual={row.cents} max={largestHolder} />
              </span>
              <span className={`shrink-0 tabular-nums ${row.holder === null ? 'text-muted' : ''}`}>
                {formatArs(row.cents)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {(installments.length > 0 || contents.installments_due.length > 0) && (
        <section>
          <SectionLabel>Cuotas</SectionLabel>
          {installments.length > 0 && (
            <p className="mb-1 text-sm text-muted">
              {countLabel(installments.length, 'cuota', 'cuotas')} en este resumen ·{' '}
              {formatArs(installmentsTotal)}
            </p>
          )}
          <ul>
            {contents.installments_due.map((due) => (
              <li key={due.month} className="flex items-center gap-3 border-b border-border py-2">
                <span className="w-28 shrink-0 text-sm">
                  {due.onward && 'desde '}
                  {monthShort(due.month)}
                </span>
                <SpendBar usual={due.ars_cents} max={largestDue} />
                <span className="shrink-0 text-sm tabular-nums">{formatArs(due.ars_cents)}</span>
              </li>
            ))}
          </ul>
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
          last4={last4Of(contents, selectedLine.holder)}
          cents={cents(selected)}
          rule={selectedFiling.rule}
          category={selectedFiling.category}
          onSave={(change, oneOff) => void handleSave(change, oneOff)}
          onRemoveRule={() => void handleRemoveRule()}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
