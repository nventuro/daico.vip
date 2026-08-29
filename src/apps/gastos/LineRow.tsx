import { IconFlag } from '@tabler/icons-react';
import { formatDayMonth } from '../../utils/dateUtils';
import { formatArs, formatUsd } from './labels';
import type { StatementLine } from './statement';

interface LineRowProps {
  line: StatementLine;
  /** The line in pesos, its dollars valued at the statement's rate. */
  cents: number;
  /** Whether the line is set apart from the usual spending. */
  oneOff?: boolean;
  /** Whether the row stands for the whole purchase rather than for the one
   *  installment the line is: a month holds a purchase once, so it says how
   *  many installments it was split into instead of which one this is. */
  whole?: boolean;
  /** Opens the line to file it; without it the row only shows what it says. */
  onSelect?: () => void;
  /** Marks the line as a one-off, or unmarks it; without it the flag is only
   *  shown, for a one-off the user cannot take back. */
  onToggleOneOff?: () => void;
}

/** One movement of a statement: when, the merchant as printed, and what it
 *  came to. The row opens it, where there is somewhere to open; the flag at
 *  its end says whether it is a one-off and toggles that, on a target of its
 *  own so a thumb landing on the text never marks anything by accident. */
export default function LineRow({
  line,
  cents,
  oneOff = false,
  whole = false,
  onSelect,
  onToggleOneOff,
}: LineRowProps) {
  const flagLabel = oneOff ? 'Quitar puntual' : 'Marcar como puntual';
  const flagClass = 'flex shrink-0 items-center pl-4 transition-colors';
  const shape = 'flex min-w-0 flex-1 items-center gap-2 py-3 text-left';
  const body = (
    <>
      <span className="w-11 shrink-0 text-xs text-muted tabular-nums">
        {formatDayMonth(line.on)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-on-surface">{line.description}</span>
        {line.installment && (
          <span className="text-xs text-muted">
            {whole
              ? `En ${line.installment.of} cuotas`
              : `Cuota ${line.installment.number} de ${line.installment.of}`}
          </span>
        )}
      </span>
      <span className="flex shrink-0 flex-col items-end text-sm tabular-nums">
        {formatArs(cents)}
        {line.usd_cents !== 0 && (
          <span className="text-xs text-muted">({formatUsd(line.usd_cents)})</span>
        )}
      </span>
    </>
  );

  return (
    <li className="flex items-stretch">
      {onSelect === undefined ? (
        <span className={shape}>{body}</span>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className={`${shape} transition-colors hover:bg-border-subtle`}
        >
          {body}
        </button>
      )}
      {onToggleOneOff ? (
        <button
          type="button"
          onClick={onToggleOneOff}
          aria-pressed={oneOff}
          aria-label={flagLabel}
          title={flagLabel}
          className={`${flagClass} ${
            oneOff ? 'text-(--app)' : 'text-neutral-hover hover:text-muted'
          }`}
        >
          <IconFlag size={18} stroke={1.5} fill={oneOff ? 'currentColor' : 'none'} />
        </button>
      ) : (
        oneOff && (
          <span
            role="img"
            aria-label="Puntual por su categoría"
            title="Puntual por su categoría"
            className={`${flagClass} text-(--app)`}
          >
            <IconFlag size={18} stroke={1.5} fill="currentColor" />
          </span>
        )
      )}
    </li>
  );
}
