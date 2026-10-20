import { describe, it, expect } from 'vitest';
import type { ShoppingItem, ShoppingSection } from '../../lib/offline/specs';
import { headingId, itemDrop, listEntries, shoppingGroups } from './listing';
import { byPosition } from './ordering';

const T0 = '2026-10-20T12:00:00.000Z';

function section(id: string, position: string): ShoppingSection {
  return { id, name: id, position, created_at: T0, updated_at: T0 };
}

function item(id: string, position: string, sectionId: string | null): ShoppingItem {
  return {
    id,
    name: id,
    checked: false,
    position,
    section_id: sectionId,
    created_at: T0,
    updated_at: T0,
  };
}

const verduleria = section('verduleria', 'a0');
const super_ = section('super', 'a1');
const ferreteria = section('ferreteria', 'a2');
const sections = [verduleria, super_, ferreteria];

/** Items in the order the store keeps them, filed across two sections and
 *  none; keys interleave, as they do once items are moved between sections. */
const items = [
  item('banana', 'a0', 'verduleria'),
  item('jabon', 'a1', 'super'),
  item('manzana', 'a2', 'verduleria'),
  item('pilas', 'a3', null),
  item('yerba', 'a4', 'super'),
  item('tornillos', 'a5', 'gone'),
];

/** The list as drawn after `id` is dropped on `overId`: each group's name and
 *  its items, in order. */
function afterDrop(id: string, overId: string): [string, string[]][] {
  const entries = listEntries(shoppingGroups(sections, items, true));
  const place = itemDrop(entries, id, overId);
  expect(place).not.toBeNull();
  const moved = items.map((i) => (i.id === id ? { ...i, ...place } : i)).sort(byPosition);
  return shoppingGroups(sections, moved).map((g) => [
    g.section?.id ?? 'none',
    g.items.map((i) => i.id),
  ]);
}

describe('shoppingGroups', () => {
  it('lists the sections with something in them, in order, then what is in none', () => {
    expect(
      shoppingGroups(sections, items).map((g) => [
        g.section?.id ?? 'none',
        g.items.map((i) => i.id),
      ]),
    ).toEqual([
      ['verduleria', ['banana', 'manzana']],
      ['super', ['jabon', 'yerba']],
      ['none', ['pilas', 'tornillos']],
    ]);
  });

  it('reads an item whose section is gone as in none', () => {
    const none = shoppingGroups(sections, items).at(-1);
    expect(none?.section).toBeNull();
    expect(none?.items.map((i) => i.id)).toContain('tornillos');
  });

  it('keeps the foot only when asked, and only under sections', () => {
    const filed = items.filter((i) => i.section_id === 'verduleria');
    expect(shoppingGroups(sections, filed).map((g) => g.section?.id ?? 'none')).toEqual([
      'verduleria',
    ]);
    expect(shoppingGroups(sections, filed, true).map((g) => g.section?.id ?? 'none')).toEqual([
      'verduleria',
      'none',
    ]);
    expect(shoppingGroups([], [], true)).toEqual([]);
  });
});

describe('listEntries', () => {
  it('heads each group, the foot included', () => {
    expect(listEntries(shoppingGroups(sections, items)).map((e) => e.id)).toEqual([
      headingId(verduleria),
      'banana',
      'manzana',
      headingId(super_),
      'jabon',
      'yerba',
      headingId(null),
      'pilas',
      'tornillos',
    ]);
  });

  it('heads nothing when nothing is filed', () => {
    const loose = items.filter((i) => i.section_id === null);
    expect(listEntries(shoppingGroups(sections, loose)).map((e) => e.id)).toEqual(['pilas']);
  });
});

describe('itemDrop', () => {
  it('reorders an item within its section', () => {
    expect(afterDrop('manzana', 'banana')).toEqual([
      ['verduleria', ['manzana', 'banana']],
      ['super', ['jabon', 'yerba']],
      ['none', ['pilas', 'tornillos']],
    ]);
  });

  it('moves an item down into the next section, right under its heading', () => {
    expect(afterDrop('manzana', headingId(super_))).toEqual([
      ['verduleria', ['banana']],
      ['super', ['manzana', 'jabon', 'yerba']],
      ['none', ['pilas', 'tornillos']],
    ]);
  });

  it('moves an item up past its heading, to the foot of the section above', () => {
    expect(afterDrop('jabon', headingId(super_))).toEqual([
      ['verduleria', ['banana', 'manzana', 'jabon']],
      ['super', ['yerba']],
      ['none', ['pilas', 'tornillos']],
    ]);
  });

  it('moves an item between two of another section', () => {
    expect(afterDrop('pilas', 'jabon')).toEqual([
      ['verduleria', ['banana', 'manzana']],
      ['super', ['pilas', 'jabon', 'yerba']],
      ['none', ['tornillos']],
    ]);
  });

  it('takes an item out of every section', () => {
    expect(afterDrop('banana', 'tornillos')).toEqual([
      ['verduleria', ['manzana']],
      ['super', ['jabon', 'yerba']],
      ['none', ['pilas', 'tornillos', 'banana']],
    ]);
  });

  it('puts an item dropped above every heading first in the first section', () => {
    expect(afterDrop('yerba', headingId(verduleria))).toEqual([
      ['verduleria', ['yerba', 'banana', 'manzana']],
      ['super', ['jabon']],
      ['none', ['pilas', 'tornillos']],
    ]);
  });

  it('is a no-op on itself, for a heading, or for an id it does not know', () => {
    const entries = listEntries(shoppingGroups(sections, items));
    expect(itemDrop(entries, 'banana', 'banana')).toBeNull();
    expect(itemDrop(entries, headingId(super_), 'banana')).toBeNull();
    expect(itemDrop(entries, 'banana', 'x')).toBeNull();
  });

  it('orders a list with no sections as one run', () => {
    const loose = [item('a', 'a0', null), item('b', 'a1', null), item('c', 'a2', null)];
    const entries = listEntries(shoppingGroups([], loose));
    const place = itemDrop(entries, 'c', 'a');
    expect(place?.section_id).toBeNull();
    expect(place!.position < 'a0').toBe(true);
  });
});
