import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';

interface LinkRowProps {
  /** Where the row opens; without it the row only shows what it says. */
  to?: string;
  /** What tapping the row does, for a row that is a choice rather than a place. */
  onClick?: () => void;
  title: string;
  /** The smaller line under the title: a date, what it came to. */
  subtitle?: ReactNode;
  /** Whether the subtitle is about something already past, which is said in
   *  the error colour. */
  overdue?: boolean;
  /** What stands before the title: an icon, for a row that is not an entry. */
  leading?: ReactNode;
  /** What stands after it: the entry's marks, what it came to. */
  trailing?: ReactNode;
  /** Whether the row ends in a chevron saying it opens something else. */
  chevron?: boolean;
}

/** One entry in a list: a hairline row that opens it, that does one thing
 *  when tapped, or — with nowhere to go — that only says what it says. The
 *  rows a list is made of, wherever nothing on the row is a control of its
 *  own. */
export default function LinkRow({
  to,
  onClick,
  title,
  subtitle,
  overdue = false,
  leading,
  trailing,
  chevron = false,
}: LinkRowProps) {
  const body = (
    <>
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
    </>
  );
  const shape = 'flex min-w-0 flex-1 items-center gap-2 py-3';
  return (
    <li className="flex items-stretch border-b border-border">
      {onClick !== undefined ? (
        <button
          type="button"
          onClick={onClick}
          className={`${shape} text-left transition-colors hover:bg-border-subtle`}
        >
          {body}
        </button>
      ) : to === undefined ? (
        <span className={shape}>{body}</span>
      ) : (
        <Link to={to} className={`${shape} transition-colors hover:bg-border-subtle`}>
          {body}
        </Link>
      )}
    </li>
  );
}
