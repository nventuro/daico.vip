import type { Guide } from '../../lib/offline/specs';
import { groupByName } from '../../utils/listUtils';

/** The guides shelved under one group. */
export interface GuideGroup {
  name: string;
  guides: Guide[];
}

/** Every group in name order, each with its guides in the order they were
 *  given — by title, as the store lists them. */
export function groupGuides(guides: Guide[]): GuideGroup[] {
  return groupByName(guides, (guide) => guide.group_name).map(({ name, items }) => ({
    name,
    guides: items,
  }));
}

/** The names of the groups there are, in name order — the archived guides'
 *  included, since a guide can be moved to a group only they still name. */
export function guideGroupNames(guides: Guide[]): string[] {
  return groupGuides(guides).map((group) => group.name);
}
