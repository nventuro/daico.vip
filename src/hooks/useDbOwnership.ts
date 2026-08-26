import { useState, useEffect } from 'react';
import { checkDbOwnership } from '../lib/offline/singleTab';

/** This tab's claim on the local database: 'checking' until resolved, then
 *  'owner' (this tab may use it) or 'blocked' (another tab already holds it). */
export type DbOwnership = 'checking' | 'owner' | 'blocked';

/**
 * Resolves whether this tab owns the single local-database connection. Treat
 * 'checking' as usable (the check settles in a microtask, so gating on it would
 * flash a loader on every load); only 'blocked' should divert the UI.
 */
export function useDbOwnership(): DbOwnership {
  const [state, setState] = useState<DbOwnership>('checking');

  useEffect(() => {
    let active = true;
    checkDbOwnership().then((owner) => {
      if (active) setState(owner ? 'owner' : 'blocked');
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
