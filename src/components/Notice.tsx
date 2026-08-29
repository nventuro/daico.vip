import type { ReactNode } from 'react';
import type { TablerIcon } from '@tabler/icons-react';

interface NoticeProps {
  icon: TablerIcon;
  /** The mark's colour; the words are always muted. */
  iconClassName?: string;
  children: ReactNode;
  className?: string;
}

/** A box saying something about the app itself rather than about what is on the
 *  page: no connection, a version waiting. The app says nothing when there is
 *  nothing to say, so one of these on screen always means something happened. */
export default function Notice({
  icon: Icon,
  iconClassName = 'text-warning',
  children,
  className = 'mb-4',
}: NoticeProps) {
  return (
    <div
      className={`flex items-start gap-2 border border-border bg-surface-raised px-3 py-2 text-sm text-muted-strong ${className}`}
    >
      <Icon size={18} stroke={1.5} className={`mt-px shrink-0 ${iconClassName}`} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
