import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';

interface SectionLabelProps {
  children: ReactNode;
  /** What the heading says beside the name, in plain type: how many rows are
   *  under it, what they come to. */
  detail?: ReactNode;
  /** Where the name leads, for a group that is also a page of its own: the
   *  name becomes a link, with a chevron right after it saying so. */
  to?: string;
  /** What stands at the end of the hairline: a control for the whole group,
   *  such as the handle it is dragged by. */
  aside?: ReactNode;
  /** Sets the colour; muted unless told otherwise. */
  className?: string;
  style?: CSSProperties;
}

/** The heading of a group of rows: small caps with a hairline running on to
 *  the edge. */
export default function SectionLabel({
  children,
  detail,
  to,
  aside,
  className = 'text-muted',
  style,
}: SectionLabelProps) {
  const name = (
    <span>
      {children}
      {detail !== undefined && (
        <span className="font-normal tracking-normal normal-case"> · {detail}</span>
      )}
    </span>
  );
  return (
    <h2
      style={style}
      className={`mb-1 flex items-center gap-3 text-xs font-medium tracking-widest uppercase ${className}`}
    >
      {to === undefined ? (
        name
      ) : (
        // Padded to a target a thumb can find, the caps alone being too small.
        <Link
          to={to}
          className="flex min-w-0 items-center gap-1 py-2 transition-colors hover:text-on-surface"
        >
          {name}
          <IconChevronRight size={16} stroke={1.5} className="shrink-0" />
        </Link>
      )}
      <span aria-hidden className="h-px flex-1 bg-border" />
      {aside}
    </h2>
  );
}
