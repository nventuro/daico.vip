import EntryMarks from '../../components/EntryMarks';
import { formatDayMonth } from '../../utils/dateUtils';
import { formatArs, formatUsd } from './labels';
import type { StatementLine } from './statement';

interface LineRowProps {
  line: StatementLine;
  /** The line in pesos, its dollars valued at the statement's rate. */
  cents: number;
  /** Opens the line to file it or mark it. */
  onSelect: () => void;
}

/** One movement of a statement: when, the merchant as printed, and what it
 *  came to. The whole row opens it. */
export default function LineRow({ line, cents, onSelect }: LineRowProps) {
  return (
    <li className="border-b border-border">
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-2 py-3 text-left transition-colors hover:bg-border-subtle"
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
        <EntryMarks marks={line.one_off ? ['oneOff'] : undefined} />
        <span className="flex shrink-0 flex-col items-end text-sm tabular-nums">
          {formatArs(cents)}
          {line.usd_cents !== 0 && (
            <span className="text-xs text-muted">({formatUsd(line.usd_cents)})</span>
          )}
        </span>
      </button>
    </li>
  );
}
