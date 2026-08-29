import type { ReactNode } from 'react';

interface HeadingProps {
  children: ReactNode;
  /** How big it reads; a page's own title unless told otherwise. */
  className?: string;
}

/** The title of what a screen is showing, in the display face. */
export default function Heading({ children, className = 'text-2xl' }: HeadingProps) {
  return <h1 className={`font-display font-black tracking-tight ${className}`}>{children}</h1>;
}
