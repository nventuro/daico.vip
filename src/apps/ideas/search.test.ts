import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as engine from '../../lib/offline/engine';
import { IDEAS_SPEC } from '../../lib/offline/specs';
import { searchIdeas } from './search';

vi.mock('sqlocal', () => import('../../lib/offline/testing/sqlocalInMemory'));

const add = (title: string, group: string, archived: boolean, body = '') =>
  engine.insert(IDEAS_SPEC, { title, group_name: group, body, archived });

describe('searching ideas', () => {
  beforeEach(async () => {
    await engine.clearAll();
  });

  it('finds an archived idea after the ones on the list, and says it is archived', async () => {
    await add('ramen del pasaje', 'restaurantes', true);
    await add('ramen de la galería', 'restaurantes', false);
    expect((await searchIdeas('ramen')).map((hit) => [hit.title, hit.subtitle])).toEqual([
      ['ramen de la galería', 'restaurantes'],
      ['ramen del pasaje', 'Archivada · restaurantes'],
    ]);
  });

  it('says so ahead of the passage when the body is what matched', async () => {
    await add('cabaña en el lago', 'vacaciones', true, 'hay un ramen muy bueno cerca');
    expect((await searchIdeas('ramen'))[0].subtitle).toBe(
      'Archivada · hay un ramen muy bueno cerca',
    );
  });

  it('says only that of an archived idea filed under no group', async () => {
    await add('clases de tango', '', true);
    expect((await searchIdeas('tango'))[0].subtitle).toBe('Archivada');
  });
});
