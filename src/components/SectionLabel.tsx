import type { CSSProperties, ReactNode } from 'react';

interface SectionLabelProps {
  children: ReactNode;
  /** Sets the colour; muted unless told otherwise. */
  className?: string;
  style?: CSSProperties;
}

/** The heading of a group of rows: small caps with a hairline running on to
 *  the edge. */
export default function SectionLabel({
  children,
  className = 'text-muted',
  style,
}: SectionLabelProps) {
  return (
    <h2
      style={style}
      className={`mb-1 flex items-center gap-3 text-xs font-medium tracking-widest uppercase ${className}`}
    >
      <span>{children}</span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </h2>
  );
}
