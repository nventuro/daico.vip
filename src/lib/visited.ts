// =============================================================================
// This page's record of where it has been: the entries of the browser history
// it has seen, and which one is open. The browser keeps its history to itself,
// so a screen that wants to step back to one it came from — rather than push
// itself on top of it — has to have been told about every visit.
// =============================================================================
import { NavigationType } from 'react-router-dom';

interface Visit {
  key: string;
  pathname: string;
}

let visits: Visit[] = [];
let open = -1;

/**
 * Notes the navigation the router just settled on: `key` is the history
 * entry's own, `action` how it was reached. The same entry told twice in a
 * row changes nothing.
 */
export function recordVisit(key: string, pathname: string, action: NavigationType): void {
  if (visits[open]?.key === key) return;
  const visit = { key, pathname };
  if (action === NavigationType.Replace && open >= 0) {
    visits[open] = visit;
    return;
  }
  if (action === NavigationType.Pop) {
    const index = visits.findIndex((known) => known.key === key);
    if (index >= 0) {
      open = index;
      return;
    }
    // An entry this page never saw — the one it was opened on, or one from
    // before a reload — is all it can know about from here on.
    visits = [visit];
    open = 0;
    return;
  }
  visits = [...visits.slice(0, open + 1), visit];
  open = visits.length - 1;
}

/** How far back the nearest visit to `pathname` is, as the negative count of
 *  steps `navigate` takes; null when it is not behind the open one. */
export function stepsBackTo(pathname: string): number | null {
  for (let index = open - 1; index >= 0; index--) {
    if (visits[index].pathname === pathname) return index - open;
  }
  return null;
}
