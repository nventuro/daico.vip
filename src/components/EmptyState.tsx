import type { ReactNode } from 'react';

/** What a list says when there is nothing in it yet — and, where it helps,
 *  what to do about it. */
export default function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-muted">{children}</p>;
}
