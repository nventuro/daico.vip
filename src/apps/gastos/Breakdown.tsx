import { useState } from 'react';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import type { SpendingCategory } from '../../lib/offline/specs';
import SectionLabel from '../../components/SectionLabel';
import { byCategory, spendParts, type CategoryShare, type Movement } from './breakdown';
import type { Rule } from './rules';
import { CATEGORY_LABELS, UNCATEGORIZED_LABEL, formatArsCompact, formatDelta } from './labels';
import Delta from './Delta';
import MovementList, { type MovementMark } from './MovementList';
import SpendBar from './SpendBar';
import SpendLegend from './SpendLegend';

/** A category's key in the set of opened ones; the unfiled lines have their own. */
const shareKey = (category: SpendingCategory | null) => category ?? 'none';

interface BreakdownProps {
  movements: Movement[];
  rules: Rule[];
  /** What each category came to in the period before this one; without it
   *  nothing is compared, since there is nothing to compare against. */
  previousByCategory?: Map<SpendingCategory | null, number>;
  /** Set when a row stands for the whole purchase rather than the one
   *  installment being billed. */
  whole?: boolean;
  markOf: (movement: Movement) => MovementMark;
  onSelect: (movement: Movement) => void;
}

/**
 * How a period's spending divides: the bar of what is usual against what is
 * set apart, then a row per category — its total, its share of the largest,
 * how far it is from the same category last time — each opening onto the
 * movements in it.
 */
export default function Breakdown({
  movements,
  rules,
  previousByCategory,
  whole = false,
  markOf,
  onSelect,
}: BreakdownProps) {
  const [opened, setOpened] = useState<Set<string>>(() => new Set());

  const { usual, oneOff, installments } = spendParts(movements, rules);
  const shares = byCategory(movements, rules);
  const largest = Math.max(...shares.map((share) => share.cents), 1);

  function toggle(share: CategoryShare) {
    setOpened((prev) => {
      const next = new Set(prev);
      const key = shareKey(share.category);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <SpendBar
          usual={usual}
          oneOff={oneOff}
          installments={installments}
          max={usual + oneOff + installments}
          size="md"
        />
        <SpendLegend
          usual={formatArsCompact(usual)}
          oneOff={formatArsCompact(oneOff)}
          installments={installments > 0 ? formatArsCompact(installments) : undefined}
          className="flex justify-between gap-3"
        />
      </div>

      <section>
        <SectionLabel>Por categoría</SectionLabel>
        <ul>
          {shares.map((share) => {
            const key = shareKey(share.category);
            const open = opened.has(key);
            const change = share.cents - (previousByCategory?.get(share.category) ?? 0);
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
                      <SpendBar usual={share.cents} max={largest} />
                      {previousByCategory && (
                        <Delta value={change} className="w-24 shrink-0 text-right text-xs">
                          {formatDelta(change)}
                        </Delta>
                      )}
                    </span>
                  </span>
                  <Chevron size={18} stroke={1.5} className="shrink-0 text-muted" />
                </button>
                {open && (
                  <div className="pb-1 pl-3">
                    <MovementList
                      movements={share.movements}
                      rules={rules}
                      whole={whole}
                      markOf={markOf}
                      onSelect={onSelect}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
