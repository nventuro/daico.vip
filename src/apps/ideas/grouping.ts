import type { Idea } from '../../lib/offline/specs';

/** How group names are ordered: in the household's language, so an accented
 *  name sits where a person would look for it rather than after the z. */
const collator = new Intl.Collator('es');

/** The ideas filed under one group. */
export interface IdeaGroup {
  name: string;
  ideas: Idea[];
}

/** Every group in name order, each with its ideas in the order they were
 *  given — the idea last written on first, as the store lists them. */
export function groupIdeas(ideas: Idea[]): IdeaGroup[] {
  const byName = new Map<string, Idea[]>();
  for (const idea of ideas) {
    const group = byName.get(idea.group_name);
    if (group) group.push(idea);
    else byName.set(idea.group_name, [idea]);
  }
  return [...byName]
    .map(([name, ideas]) => ({ name, ideas }))
    .sort((a, b) => collator.compare(a.name, b.name));
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
