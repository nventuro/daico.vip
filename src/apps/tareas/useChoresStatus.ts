import type { Chore } from '../../types';
import { countLabel } from '../../utils/textUtils';
import { todayIso } from '../../utils/dateUtils';
import { useChores } from './useChores';

/** "2 vencidas · 5 pendientes" — overdue first, since that is what needs
 *  acting on; just "5 pendientes" when nothing is late; null when nothing is
 *  pending at all. */
export function statusLabel(chores: Chore[], today: string): string | null {
  const pending = chores.filter((chore) => !chore.done);
  if (pending.length === 0) return null;
  const overdue = pending.filter((chore) => chore.due_on != null && chore.due_on < today).length;
  const pendingLabel = countLabel(pending.length, 'pendiente', 'pendientes');
  return overdue > 0 ? `${countLabel(overdue, 'vencida', 'vencidas')} · ${pendingLabel}` : pendingLabel;
}

/** Tile subline: how many chores are pending (and overdue), or null when none. */
export function useChoresStatus(): string | null {
  const { items } = useChores();
  return statusLabel(items, todayIso());
}
