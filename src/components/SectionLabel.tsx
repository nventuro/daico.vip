import type { CSSProperties, ReactNode } from 'react';

interface SectionLabelProps {
  children: ReactNode;
  /** What the heading says beside the name, in plain type: how many rows are
   *  under it, what they come to. */
  detail?: ReactNode;
  /** Sets the colour; muted unless told otherwise. */
  className?: string;
  style?: CSSProperties;
}

/** The heading of a group of rows: small caps with a hairline running on to
 *  the edge. */
export default function SectionLabel({
  children,
  detail,
  className = 'text-muted',
  style,
}: SectionLabelProps) {
  return (
    <h2
      style={style}
      className={`mb-1 flex items-center gap-3 text-xs font-medium tracking-widest uppercase ${className}`}
    >
      <span>
        {children}
        {detail !== undefined && (
          <span className="font-normal tracking-normal normal-case"> · {detail}</span>
        )}
      </span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </h2>
  );
}
