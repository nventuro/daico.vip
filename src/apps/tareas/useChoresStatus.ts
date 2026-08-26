import { countLabel } from '../../utils/textUtils';
import { useChores } from './useChores';

/** Tile subline: how many chores are pending, or null when none. */
export function useChoresStatus(): string | null {
  const { items } = useChores();
  const pending = items.filter((chore) => !chore.done).length;
  return pending > 0 ? countLabel(pending, 'pendiente', 'pendientes') : null;
}
