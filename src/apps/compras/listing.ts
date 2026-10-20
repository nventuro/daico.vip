import type { ShoppingItem, ShoppingSection } from '../../lib/offline/specs';
import { arrayMove, keyForIndex } from './ordering';

/** The items of one section on the list, or — with `section` null — those in
 *  none. */
export interface ShoppingGroup {
  section: ShoppingSection | null;
  items: ShoppingItem[];
}

/**
 * The list as it is drawn: every section that has something in it, in the
 * household's order, then what is in none. An item whose section is gone is
 * in none. `keepUnfiled` keeps the last group even when it is empty, for
 * something to be dropped into it. Items keep their order within a group.
 */
export function shoppingGroups(
  sections: ShoppingSection[],
  items: ShoppingItem[],
  keepUnfiled = false,
): ShoppingGroup[] {
  const known = new Set(sections.map((s) => s.id));
  const filed = sections
    .map((section) => ({ section, items: items.filter((i) => i.section_id === section.id) }))
    .filter((group) => group.items.length > 0);
  const unfiled = items.filter((i) => i.section_id === null || !known.has(i.section_id));
  return unfiled.length > 0 || (keepUnfiled && filed.length > 0)
    ? [...filed, { section: null, items: unfiled }]
    : filed;
}

/** One sortable thing on the list: a group's heading, or an item. */
export type ListEntry =
  | { kind: 'heading'; id: string; sectionId: string | null }
  | { kind: 'item'; id: string; item: ShoppingItem };

/** What a group's heading is called among the list's sortable entries; never
 *  an item's, which are ids of their own. */
export function headingId(section: ShoppingSection | null): string {
  return `section:${section?.id ?? 'none'}`;
}

/** The list's entries in the order they are drawn. With nothing filed there
 *  are no headings: the list is its items, as it is without sections. */
export function listEntries(groups: ShoppingGroup[]): ListEntry[] {
  const headed = groups.some((g) => g.section !== null);
  return groups.flatMap((group) => [
    ...(headed
      ? [
          {
            kind: 'heading' as const,
            id: headingId(group.section),
            sectionId: group.section?.id ?? null,
          },
        ]
      : []),
    ...group.items.map((item) => ({ kind: 'item' as const, id: item.id, item })),
  ]);
}

/**
 * Where item `activeId` goes when it is dropped on `overId`'s place among the
 * list's `entries`: the section of the heading it then sits under — the first
 * one, when it is dropped above them all — and the key for its place among
 * that section's items. Null when the drop changes nothing or no key can be
 * minted there.
 */
export function itemDrop(
  entries: ListEntry[],
  activeId: string,
  overId: string,
): { section_id: string | null; position: string } | null {
  const from = entries.findIndex((e) => e.id === activeId);
  const to = entries.findIndex((e) => e.id === overId);
  if (from === -1 || to === -1 || from === to || entries[from].kind !== 'item') return null;

  const reordered = arrayMove(entries, from, to);
  let heading = -1;
  for (let i = to - 1; i >= 0 && heading === -1; i -= 1) {
    if (reordered[i].kind === 'heading') heading = i;
  }
  if (heading === -1) heading = reordered.findIndex((e) => e.kind === 'heading');
  const head = heading === -1 ? null : reordered[heading];

  let end = heading + 1;
  while (end < reordered.length && reordered[end].kind === 'item') end += 1;
  const group = reordered.slice(heading + 1, end);
  const at = Math.max(
    0,
    group.findIndex((e) => e.id === activeId),
  );
  const rows = group.flatMap((e) => (e.kind === 'item' && e.id !== activeId ? [e.item] : []));
  const position = keyForIndex(rows, at);
  if (position === null) return null;
  return { section_id: head?.kind === 'heading' ? head.sectionId : null, position };
}
