import { useCallback, type MouseEvent, type MouseEventHandler } from 'react';
import { useNavigate } from 'react-router-dom';
import { previousPathname, stepsBackTo } from '../lib/visited';

/** A tap meant for this page: the main button, no modifier. Anything else
 *  (a middle click, ctrl-click) is the browser's to open a new tab with. */
function plainClick(e: MouseEvent<HTMLElement>): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/**
 * The one way an entry page goes to another screen: back to it when it is
 * behind in this page's history, in the current screen's place otherwise. A
 * page is left, never stacked on, so where a delete leads is where the back
 * button would have led — and an entry already gone is never returned to.
 * Going down, from a list to one of its entries, stays an ordinary link.
 */
export function useLeave(): (to: string) => void {
  const navigate = useNavigate();
  return useCallback(
    (to: string) => {
      const steps = stepsBackTo(to);
      if (steps === null) void navigate(to, { replace: true });
      else void navigate(steps);
    },
    [navigate],
  );
}

/**
 * What a link that leaves the page for `to` is given: where it leads, which
 * stays its address for the browser's own gestures, and the tap that leaves
 * for it instead of following it.
 */
export function useLeaveLink(to: string): {
  to: string;
  onClick: MouseEventHandler<HTMLElement>;
} {
  const leave = useLeave();
  const onClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (!plainClick(e)) return;
      e.preventDefault();
      leave(to);
    },
    [leave, to],
  );
  return { to, onClick };
}

/**
 * The way out of a page for the one control that leaves it — the square that
 * marks an entry: back to the screen the page was opened from, whichever it
 * was, so a page opened from Próximo returns to Próximo; up to `fallback`
 * when this page knows of nothing behind (it was opened on this page).
 */
export function useLeaveBack(): (fallback: string) => void {
  const leave = useLeave();
  return useCallback((fallback: string) => leave(previousPathname() ?? fallback), [leave]);
}
