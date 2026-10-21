import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';

interface LinkRowProps {
  /** Where the row opens; without it the row only shows what it says. */
  to?: string;
  /** What tapping the row does, for a row that is a choice rather than a place. */
  onClick?: () => void;
  title: string;
  /** What stands right after the title, on its line: a few glyphs that say
   *  more about the entry, never a control. */
  titleAside?: ReactNode;
  /** What stands at the far end of the title's line, reaching over the
   *  trailing marks so it ends where every row does: a figure that lines up
   *  down the list, never a control. */
  titleEnd?: ReactNode;
  /** The smaller line under the title: a date, what it came to. */
  subtitle?: ReactNode;
  /** A second smaller line, for an entry with two things of a line's length
   *  to say: where a journey starts, and where it ends. */
  secondLine?: ReactNode;
  /** Whether the subtitle is about something already past, which is said in
   *  the error colour. */
  overdue?: boolean;
  /** What stands before the title: an icon, for a row that is not an entry. */
  leading?: ReactNode;
  /** What stands after it: the entry's marks, what it came to. */
  trailing?: ReactNode;
  /** Whether the row ends in a chevron saying it opens something else. */
  chevron?: boolean;
  /** Whether the title is said in the muted colour: a choice that stands
   *  apart from the entries listed over it, such as filing under none. */
  muted?: boolean;
}

/** One entry in a list: a hairline row that opens it, that does one thing
 *  when tapped, or — with nowhere to go — that only says what it says. The
 *  rows a list is made of, wherever nothing on the row is a control of its
 *  own. */
export default function LinkRow({
  to,
  onClick,
  title,
  titleAside,
  titleEnd,
  subtitle,
  secondLine,
  overdue = false,
  leading,
  trailing,
  chevron = false,
  muted = false,
}: LinkRowProps) {
  const titleClass = `truncate ${muted ? 'text-muted' : 'text-on-surface'}`;
  const titleLine =
    titleAside === undefined && titleEnd === undefined ? (
      <span className={titleClass}>{title}</span>
    ) : (
      <span
        className={`flex min-w-0 items-center gap-2 ${titleEnd === undefined ? '' : 'col-[1/3] row-start-1'}`}
      >
        <span className={titleClass}>{title}</span>
        {titleAside}
        {titleEnd !== undefined && <span className="ml-auto flex shrink-0">{titleEnd}</span>}
      </span>
    );
  const lines = (
    <>
      {subtitle !== undefined && (
        <span className={`mt-0.5 truncate text-xs ${overdue ? 'text-error' : 'text-muted'}`}>
          {subtitle}
        </span>
      )}
      {secondLine !== undefined && (
        <span className="mt-0.5 truncate text-xs text-muted">{secondLine}</span>
      )}
    </>
  );
  const body = (
    <>
      {leading}
      {titleEnd === undefined ? (
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            {titleLine}
            {lines}
          </span>
          {trailing}
        </>
      ) : (
        // The title's line spans both columns, so what ends it ends where the
        // row does, over the marks, which stay centred on the row.
        <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2">
          {titleLine}
          <span className="col-start-1 row-start-2 flex min-w-0 flex-col">{lines}</span>
          {trailing !== undefined && <span className="col-start-2 row-[1/3] flex">{trailing}</span>}
        </span>
      )}
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
