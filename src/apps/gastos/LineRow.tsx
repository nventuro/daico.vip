import { IconFlag } from '@tabler/icons-react';
import { formatDayMonth } from '../../utils/dateUtils';
import { formatArs, formatUsd } from './labels';
import type { StatementLine } from './statement';

interface LineRowProps {
  line: StatementLine;
  /** The line in pesos, its dollars valued at the statement's rate. */
  cents: number;
  /** Opens the line to file it. */
  onSelect: () => void;
  /** Marks the line as a one-off, or unmarks it; without it the row carries
   *  no flag. */
  onToggleOneOff?: () => void;
}

/** One movement of a statement: when, the merchant as printed, and what it
 *  came to. The row opens it; the flag at its end says whether it is a
 *  one-off and toggles that, on a target of its own so a thumb landing on
 *  the text never marks anything by accident. */
export default function LineRow({ line, cents, onSelect, onToggleOneOff }: LineRowProps) {
  const flagLabel = line.one_off ? 'Quitar puntual' : 'Marcar como puntual';
  return (
    <li className="flex items-stretch">
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 py-3 text-left transition-colors hover:bg-border-subtle"
      >
        <span className="w-11 shrink-0 text-xs text-muted tabular-nums">
          {formatDayMonth(line.on)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm text-on-surface">{line.description}</span>
          {line.installment && (
            <span className="text-xs text-muted">
              Cuota {line.installment.number} de {line.installment.of}
            </span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end text-sm tabular-nums">
          {formatArs(cents)}
          {line.usd_cents !== 0 && (
            <span className="text-xs text-muted">({formatUsd(line.usd_cents)})</span>
          )}
        </span>
      </button>
      {onToggleOneOff && (
        <button
          type="button"
          onClick={onToggleOneOff}
          aria-pressed={line.one_off}
          aria-label={flagLabel}
          title={flagLabel}
          className={`flex shrink-0 items-center pl-4 transition-colors ${
            line.one_off ? 'text-(--app)' : 'text-neutral-hover hover:text-muted'
          }`}
        >
          <IconFlag size={18} stroke={1.5} fill={line.one_off ? 'currentColor' : 'none'} />
        </button>
      )}
    </li>
  );
}
