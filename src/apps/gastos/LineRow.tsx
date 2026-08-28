import EntryMarks from '../../components/EntryMarks';
import { formatDayMonth } from '../../utils/dateUtils';
import { formatArs, formatUsd, holderShort } from './labels';
import type { StatementLine } from './statement';

interface LineRowProps {
  line: StatementLine;
  /** The last digits of the card it was made with, when the statement prints them. */
  last4: string | null;
  /** The line in pesos, its dollars valued at the statement's rate. */
  cents: number;
  /** Opens the line to file it or mark it. */
  onSelect: () => void;
}

/** One movement of a statement: when and by whom, the merchant as printed,
 *  and what it came to. The whole row opens it. */
export default function LineRow({ line, last4, cents, onSelect }: LineRowProps) {
  return (
    <li className="border-b border-border">
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-2 py-3 text-left transition-colors hover:bg-border-subtle"
      >
        <span className="w-22 shrink-0 truncate text-xs text-muted tabular-nums">
          {formatDayMonth(line.on)} · {holderShort(line.holder, last4)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm text-on-surface">{line.description}</span>
          {line.usd_cents !== 0 && (
            <span className="text-xs text-muted">
              {formatUsd(line.usd_cents)} al cambio del resumen
            </span>
          )}
          {line.installment && (
            <span className="text-xs text-muted">
              Cuota {line.installment.number} de {line.installment.of}
            </span>
          )}
        </span>
        <EntryMarks marks={line.one_off ? ['oneOff'] : undefined} />
        <span className="shrink-0 text-sm tabular-nums">{formatArs(cents)}</span>
      </button>
    </li>
  );
}
