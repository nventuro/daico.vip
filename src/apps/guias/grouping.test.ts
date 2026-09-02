import { describe, it, expect } from 'vitest';
import type { Guide } from '../../lib/offline/specs';
import { groupGuides, guideGroupNames } from './grouping';

function guide(title: string, group: string, archived = false): Guide {
  return {
    id: title,
    title,
    description: null,
    group_name: group,
    archived,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  };
}

// As the store lists them: by title.
const GUIDES = [
  guide('Ajedrez para empezar', 'Ámbar'),
  guide('Cómo hacer pan', 'Taller'),
  guide('Cómo sacar manchas', 'Taller', true),
  guide('Nudos', 'casa'),
];

describe('grouping guides', () => {
  it('heads every group in the order a person would look for it, guides as given', () => {
    expect(groupGuides(GUIDES).map((g) => [g.name, g.guides.map((guide) => guide.title)])).toEqual([
      ['Ámbar', ['Ajedrez para empezar']],
      ['casa', ['Nudos']],
      ['Taller', ['Cómo hacer pan', 'Cómo sacar manchas']],
    ]);
  });

  it('names the groups there are, once each, in the same order', () => {
    expect(guideGroupNames(GUIDES)).toEqual(['Ámbar', 'casa', 'Taller']);
    expect(guideGroupNames([])).toEqual([]);
  });
});
