import { describe, it, expect } from 'vitest';
import type { Idea } from '../../lib/offline/specs';
import { NO_GROUP, groupIdeas, groupNames, lastEditedGroup } from './grouping';

function idea(id: string, group: string, editedAt = '2026-09-01T12:00:00.000Z'): Idea {
  return {
    id,
    title: id,
    group_name: group,
    body: '',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: editedAt,
  };
}

// As the store lists them: by group in its own order, then the last edited first.
const IDEAS = [
  idea('cortinas', 'casa', '2026-09-01T10:00:00.000Z'),
  idea('estantes', 'casa', '2026-08-30T10:00:00.000Z'),
  idea('helados', 'comer', '2026-09-01T18:30:00.000Z'),
  idea('la del documental', 'películas'),
  idea('el jacarandá', 'árboles'),
];

describe('grouping ideas', () => {
  it('heads every group in the order a person would look for it, ideas as given', () => {
    expect(groupIdeas(IDEAS).map((g) => [g.name, g.ideas.map((i) => i.id)])).toEqual([
      ['árboles', ['el jacarandá']],
      ['casa', ['cortinas', 'estantes']],
      ['comer', ['helados']],
      ['películas', ['la del documental']],
    ]);
  });

  it('names the groups there are, once each, in the same order', () => {
    expect(groupNames(IDEAS)).toEqual(['árboles', 'casa', 'comer', 'películas']);
    expect(groupNames([])).toEqual([]);
  });

  it('lists the ideas filed under no group ahead of every group, which is not one', () => {
    const loose = [idea('un rompecabezas', NO_GROUP), idea('cortar el pasto', NO_GROUP)];
    const groups = groupIdeas([...IDEAS, ...loose]);
    expect(groups[0]).toEqual({ name: NO_GROUP, ideas: loose });
    expect(groups.slice(1).map((g) => g.name)).toEqual(['árboles', 'casa', 'comer', 'películas']);
    expect(groupNames([...IDEAS, ...loose])).toEqual(['árboles', 'casa', 'comer', 'películas']);
  });

  it('offers the group of the idea last written on, whatever its group order', () => {
    expect(lastEditedGroup(IDEAS)).toBe('comer');
    expect(lastEditedGroup([])).toBe(NO_GROUP);
  });

  it('offers no group after an idea filed under none', () => {
    const loose = idea('un rompecabezas', NO_GROUP, '2026-09-02T09:00:00.000Z');
    expect(lastEditedGroup([...IDEAS, loose])).toBe(NO_GROUP);
  });

  it('reads timestamps as instants, whatever their spelling', () => {
    const later = idea('después', 'salidas', '2026-09-01T18:30:01+00:00');
    expect(lastEditedGroup([...IDEAS, later])).toBe('salidas');
  });
});
