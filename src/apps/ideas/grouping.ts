import type { Idea } from '../../lib/offline/specs';
import { groupByName } from '../../utils/listUtils';

/** The ideas filed under one group. */
export interface IdeaGroup {
  name: string;
  ideas: Idea[];
}

/** Every group in name order, each with its ideas in the order they were
 *  given — the idea last written on first, as the store lists them. */
export function groupIdeas(ideas: Idea[]): IdeaGroup[] {
  return groupByName(ideas, (idea) => idea.group_name).map(({ name, items }) => ({
    name,
    ideas: items,
  }));
}

/** The names of the groups there are, in name order. */
export function groupNames(ideas: Idea[]): string[] {
  return groupIdeas(ideas).map((group) => group.name);
}

/** The group of the idea last written on — the one a new idea most likely
 *  joins; undefined while there are no ideas at all. */
export function lastEditedGroup(ideas: Idea[]): string | undefined {
  let last: Idea | undefined;
  for (const idea of ideas) {
    if (!last || Date.parse(idea.updated_at) > Date.parse(last.updated_at)) last = idea;
  }
  return last?.group_name;
}
