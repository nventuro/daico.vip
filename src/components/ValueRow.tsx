import type { ReactNode } from 'react';

interface ValueRowProps {
  label: string;
  /** What the row has to say about it, on the right. */
  value: ReactNode;
  /** Set when the value is something being reported as wrong. */
  bad?: boolean;
  /** A line under the label, for what the value alone does not say. */
  note?: ReactNode;
  /** Something to do about it, under the note. */
  action?: ReactNode;
}

/** A row that states one thing: what it is on the left, what it says on the
 *  right, and — when the value needs it — a line and an action underneath. */
export default function ValueRow({ label, value, bad = false, note, action }: ValueRowProps) {
  return (
    <li className="flex items-start gap-3 border-b border-border py-3">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base">{label}</span>
        {note !== undefined && <span className="mt-0.5 text-xs text-muted">{note}</span>}
        {action !== undefined && <span className="mt-1.5">{action}</span>}
      </span>
      <span className={`shrink-0 text-sm ${bad ? 'text-error' : 'text-muted'}`}>{value}</span>
    </li>
  );
}
