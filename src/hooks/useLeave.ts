import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { previousPathname, stepsBackTo } from '../lib/visited';

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
      if (steps === null) navigate(to, { replace: true });
      else navigate(steps);
    },
    [navigate],
  );
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
