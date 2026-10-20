import { useMemo, useState } from 'react';
import {
  DndContext,
  MeasuringStrategy,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ShoppingItem, ShoppingSection } from '../../lib/offline/specs';
import SectionLabel from '../../components/SectionLabel';
import { headingId, itemDrop, listEntries, shoppingGroups } from './listing';
import { byPosition, keyForMove } from './ordering';
import FoldedSection from './FoldedSection';
import SortableSectionHeading from './SortableSectionHeading';
import SortableShoppingItem from './SortableShoppingItem';
import { useDragSensors } from './useDragSensors';
import { useDropped } from './useDropped';

/** Where an item was dropped: its new key, and the section it went into. */
export type ItemPlace = Pick<ShoppingItem, 'position' | 'section_id'>;

interface GroupedListProps {
  sections: ShoppingSection[];
  items: ShoppingItem[];
  onToggle: (item: ShoppingItem) => void;
  onMoveItem: (id: string, place: ItemPlace) => void;
  onMoveSection: (id: string, position: string) => void;
}

/**
 * The whole list, under the heading of the section each item is bought in,
 * what is in none last. An item is dragged by its handle to another place,
 * in its section or another's; a section by the handle on its heading, which
 * folds the list to its headings while it is moved.
 */
export default function GroupedList({
  sections,
  items,
  onToggle,
  onMoveItem,
  onMoveSection,
}: GroupedListProps) {
  const [sectionView, setSectionView] = useDropped(sections);
  const [itemView, setItemView] = useDropped(items);
  const [dragging, setDragging] = useState<'item' | 'section' | null>(null);
  const sensors = useDragSensors();

  // While an item is dragged the foot of the list is kept, even with nothing
  // in it, so an item can be taken out of every section.
  const groups = useMemo(
    () => shoppingGroups(sectionView, itemView, dragging === 'item'),
    [sectionView, itemView, dragging],
  );
  const entries = useMemo(() => listEntries(groups), [groups]);
  const filed = groups.flatMap((g) => (g.section ? [{ ...g, section: g.section }] : []));
  const unfiled = groups.find((g) => g.section === null);

  function handleDragStart({ active }: DragStartEvent) {
    setDragging(active.data.current?.section ? 'section' : 'item');
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDragging(null);
    if (!over || active.id === over.id) return;
    const section = active.data.current?.section as ShoppingSection | undefined;
    if (section) {
      const headings = filed.map((g) => ({
        id: headingId(g.section),
        position: g.section.position,
      }));
      const position = keyForMove(headings, String(active.id), String(over.id));
      if (position === null) return;
      setSectionView((v) =>
        v.map((s) => (s.id === section.id ? { ...s, position } : s)).sort(byPosition),
      );
      onMoveSection(section.id, position);
      return;
    }
    const place = itemDrop(entries, String(active.id), String(over.id));
    if (place === null) return;
    setItemView((v) =>
      v.map((i) => (i.id === active.id ? { ...i, ...place } : i)).sort(byPosition),
    );
    onMoveItem(String(active.id), place);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      // The folded headings take the place of the list after the drag has
      // begun, and have to be measured where they are drawn.
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      {dragging === 'section' ? (
        <SortableContext
          items={filed.map((g) => headingId(g.section))}
          strategy={verticalListSortingStrategy}
        >
          {filed.map((g) => (
            <FoldedSection key={g.section.id} section={g.section} count={g.items.length} />
          ))}
          {unfiled && (
            <div className="py-2.5">
              <SectionLabel detail={unfiled.items.length}>Sin sección</SectionLabel>
            </div>
          )}
        </SortableContext>
      ) : (
        <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          {groups.map((group) => (
            <section key={headingId(group.section)} className="mb-6">
              {filed.length > 0 && <SortableSectionHeading section={group.section} />}
              <ul>
                {group.items.map((item) => (
                  <SortableShoppingItem key={item.id} item={item} onToggle={() => onToggle(item)} />
                ))}
              </ul>
            </section>
          ))}
        </SortableContext>
      )}
    </DndContext>
  );
}
