import { useState } from 'react';
import { useLocation } from 'react-router-dom';

/** What was left open, by history entry and by the name its caller gave it. */
const openedByEntry = new Map<string, Set<string>>();

/**
 * Which of a screen's collapsible parts are open, under `name`: nothing when
 * the screen is reached anew, and what was left open when it is come back to.
 * The browser shows a screen gone back to as it was left before the app draws
 * it again, so drawing it any other way flashes.
 */
export function useOpenedHere(name: string): {
  isOpen: (key: string) => boolean;
  toggle: (key: string) => void;
} {
  const entryKey = `${useLocation().key}:${name}`;
  const [opened, setOpened] = useState<ReadonlySet<string>>(
    () => new Set(openedByEntry.get(entryKey)),
  );

  function toggle(key: string) {
    const next = new Set(opened);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    openedByEntry.set(entryKey, next);
    setOpened(next);
  }

  return { isOpen: (key) => opened.has(key), toggle };
}
