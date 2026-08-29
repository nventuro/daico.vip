import { describe, it, expect, beforeEach, vi } from 'vitest';
import { excerpt, matches, searchTable } from './search';
import * as engine from './offline/engine';
import { newChore } from './offline/testing/rows';
import { ATTACHMENTS_SPEC, CHORES_SPEC } from './offline/specs';

vi.mock('sqlocal', () => import('./offline/testing/sqlocalInMemory'));

describe('matches', () => {
  it('ignores case and accents', () => {
    expect(matches('Cumpleaños', 'cumpleanos')).toBe(true);
    expect(matches('noquis', 'ÑOQUIS')).toBe(true);
  });

  it('is false for missing or empty text', () => {
    expect(matches(null, 'a')).toBe(false);
    expect(matches(undefined, 'a')).toBe(false);
    expect(matches('', 'a')).toBe(false);
  });

  it('is false when the text does not hold the query', () => {
    expect(matches('abc', 'd')).toBe(false);
  });
});

describe('excerpt', () => {
  it('keeps radius characters either side of the match', () => {
    expect(excerpt('hola mundo cruel', 'mundo', 5)).toBe('hola mundo crue…');
    expect(excerpt('aaaaaaaaaa mundo bbbbbbbbbb', 'mundo', 3)).toBe('…aa mundo bb…');
  });

  it('finds the match ignoring case and accents but returns the original text', () => {
    expect(excerpt('Los Ñoquis del 29', 'noquis', 4)).toBe('Los Ñoquis del…');
  });

  it('collapses whitespace', () => {
    expect(excerpt('uno\n\ndos tres', 'dos', 2)).toBe('…o dos t…');
  });

  it('falls back to the head of the text when nothing matches', () => {
    expect(excerpt('hola mundo', 'xyz', 3)).toBe('hola m…');
  });

  it('adds no ellipsis when nothing is cut', () => {
    expect(excerpt('hola mundo', 'mundo', 10)).toBe('hola mundo');
    expect(excerpt('hola', 'xyz', 3)).toBe('hola');
  });
});

describe('searchTable', () => {
  beforeEach(async () => {
    await engine.clearAll();
  });

  const add = (title: string, notes: string | null = null) =>
    engine.insert(CHORES_SPEC, { ...newChore, title, notes });

  const hits = (query: string) =>
    searchTable(CHORES_SPEC, query, {
      fields: ['title', 'notes'],
      hit: (chore, matched) => ({
        title: chore.title,
        subtitle: matched,
        to: `/tareas/${chore.id}`,
      }),
    });

  it('finds a row by any of the fields it is told to read', async () => {
    await add('regar las plantas');
    await add('llamar al plomero', 'el del baño');
    expect((await hits('plant')).map((h) => h.title)).toEqual(['regar las plantas']);
    expect((await hits('baño')).map((h) => h.title)).toEqual(['llamar al plomero']);
  });

  it('says which field matched, so a hit can quote the right one', async () => {
    await add('comprar pan', 'de la panadería');
    expect((await hits('pan'))[0].subtitle).toBe('title');
    expect((await hits('panadería'))[0].subtitle).toBe('notes');
  });

  it('finds nothing in a row whose fields are empty', async () => {
    await add('regar');
    expect(await hits('nada')).toEqual([]);
  });

  it("caps nothing: how many results an app gives is the shell's to say", async () => {
    for (let i = 0; i < 25; i++) await add(`tarea ${i}`);
    expect(await hits('tarea')).toHaveLength(25);
  });

  it('lists an attachment named like the query under the entry it belongs to', async () => {
    const id = await add('pasaporte');
    const picture = await engine.insert(ATTACHMENTS_SPEC, {
      owner_kind: 'chore',
      owner_id: id,
      name: 'foto del recibo',
      mime: 'image/png',
      size: 1,
      wrapped_file_key: 'k',
    });
    const found = await searchTable(CHORES_SPEC, 'recibo', {
      fields: ['title'],
      attachments: 'chore',
      hit: (chore) => ({ title: chore.title, to: `/tareas/${chore.id}` }),
    });
    expect(found).toEqual([
      { title: 'foto del recibo', subtitle: 'pasaporte', to: `/tareas/${id}/${picture}` },
    ]);
  });

  it('leaves out an attachment of an entry the search never listed', async () => {
    await engine.insert(ATTACHMENTS_SPEC, {
      owner_kind: 'chore',
      owner_id: 'gone',
      name: 'foto',
      mime: 'image/png',
      size: 1,
      wrapped_file_key: 'k',
    });
    const found = await searchTable(CHORES_SPEC, 'foto', {
      fields: ['title'],
      attachments: 'chore',
      hit: (chore) => ({ title: chore.title, to: `/tareas/${chore.id}` }),
    });
    expect(found).toEqual([]);
  });
});
