import type { Idea } from '../../lib/offline/specs';
import { groupByName } from '../../utils/listUtils';

/** The ideas filed under one group. */
export interface IdeaGroup {
  name: string;
  ideas: Idea[];
}

/** The group of an idea filed under none. */
export const NO_GROUP = '';

/** The ideas filed under no group first, then every group in name order,
 *  each with its ideas in the order they were given — the idea last written
 *  on first, as the store lists them. */
export function groupIdeas(ideas: Idea[]): IdeaGroup[] {
  const groups = groupByName(ideas, (idea) => idea.group_name).map(({ name, items }) => ({
    name,
    ideas: items,
  }));
  // Ahead of the groups by rule, not by where the collation happens to put
  // an empty name: they are the ideas not filed anywhere yet.
  return [
    ...groups.filter((group) => group.name === NO_GROUP),
    ...groups.filter((group) => group.name !== NO_GROUP),
  ];
}

/** The names of the groups there are, in name order; none for the ideas
 *  filed under none. */
export function groupNames(ideas: Idea[]): string[] {
  return groupIdeas(ideas)
    .map((group) => group.name)
    .filter((name) => name !== NO_GROUP);
}

/** The group a new idea is born in: that of the idea last written on, the
 *  one it most likely joins — none while there are no ideas at all. */
export function lastEditedGroup(ideas: Idea[]): string {
  let last: Idea | undefined;
  for (const idea of ideas) {
    if (!last || Date.parse(idea.updated_at) > Date.parse(last.updated_at)) last = idea;
  }
  return last?.group_name ?? NO_GROUP;
}
