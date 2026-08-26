import type { Guide } from '../../types';
import { GUIDES_SPEC } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { countLabel } from '../../utils/textUtils';

/** Tile subline: how many guides there are, or null when none. */
export function useGuidesStatus(): string | null {
  const { items } = useOfflineTable<Guide>(GUIDES_SPEC);
  return items.length > 0 ? countLabel(items.length, 'guía', 'guías') : null;
}
