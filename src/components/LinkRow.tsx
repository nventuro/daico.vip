import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';

interface LinkRowProps {
  /** Where the row opens. */
  to: string;
  title: string;
  /** The smaller line under the title: a date, what it came to. */
  subtitle?: ReactNode;
  /** Whether the subtitle is about something already past, which is said in
   *  the error colour. */
  overdue?: boolean;
  /** What stands before the title: an icon, for a row that is not an entry. */
  leading?: ReactNode;
  /** What stands after it: the entry's marks. */
  trailing?: ReactNode;
  /** Whether the row ends in a chevron saying it opens something else. */
  chevron?: boolean;
}

/** One entry in a list: a hairline row that opens it. The rows a list is made
 *  of, wherever nothing on the row is a control of its own. */
export default function LinkRow({
  to,
  title,
  subtitle,
  overdue = false,
  leading,
  trailing,
  chevron = false,
}: LinkRowProps) {
  return (
    <li className="flex items-stretch border-b border-border">
      <Link
        to={to}
        className="flex min-w-0 flex-1 items-center gap-2 py-3 transition-colors hover:bg-border-subtle"
      >
        {leading}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-on-surface">{title}</span>
          {subtitle !== undefined && (
            <span className={`mt-0.5 truncate text-xs ${overdue ? 'text-error' : 'text-muted'}`}>
              {subtitle}
            </span>
          )}
        </span>
        {trailing}
        {chevron && <IconChevronRight size={18} stroke={1.5} className="shrink-0 text-muted" />}
      </Link>
    </li>
  );
}
