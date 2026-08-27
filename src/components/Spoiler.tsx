import { useState, type ReactNode } from 'react';

/** Inline text hidden until tapped — for answers the reader should think about first. */
export default function Spoiler({ children }: { children?: ReactNode }) {
  const [shown, setShown] = useState(false);

  if (shown) return <span className="bg-primary-subtle px-1">{children}</span>;

  return (
    <button
      type="button"
      onClick={() => setShown(true)}
      className="bg-border-subtle px-2 py-0.5 text-sm font-bold text-muted-strong transition-colors hover:bg-neutral-hover"
    >
      Mostrar
    </button>
  );
}
