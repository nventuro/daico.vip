import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { stepsBackTo } from '../lib/visited';

/**
 * The one way an entry page or a creation form goes to another screen: back
 * to it when it is behind in this page's history, in the current screen's
 * place otherwise. A page is left, never stacked on, so where a Guardar or a
 * delete leads is where the back button would have led — and a form already
 * saved or an entry already gone is never returned to. Going down, from a
 * list to one of its entries, stays an ordinary link.
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
