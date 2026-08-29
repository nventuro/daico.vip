import { useCallback, useEffect, useState } from 'react';

/** How long (ms) an undo bar stays up after a reversible action. */
export const UNDO_MS = 5000;

/**
 * Holds the one thing that can currently be undone, for `ms` after it is
 * offered. `offer` replaces any earlier offer (only the latest action is
 * reversible); `clear` drops it early, e.g. once the undo has been taken.
 */
export function useUndo<T>(ms: number) {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    if (value === null) return;
    const timer = setTimeout(() => setValue(null), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  const offer = useCallback((next: T) => setValue(next), []);
  const clear = useCallback(() => setValue(null), []);

  return { value, offer, clear };
}
