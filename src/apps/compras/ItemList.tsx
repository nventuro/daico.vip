import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ShoppingItem } from '../../lib/offline/specs';
import { keyForMove } from './ordering';
import SortableShoppingItem from './SortableShoppingItem';
import { useDragSensors } from './useDragSensors';
import { useDropped } from './useDropped';

interface ItemListProps {
  /** The items, in the order they are kept. */
  items: ShoppingItem[];
  onToggle: (item: ShoppingItem) => void;
  /** Called with a dragged item's new key. */
  onMove: (id: string, position: string) => void;
}

/** Items in one run, as a section's page lists them: a tap strikes one, and
 *  its handle drags it to another place. */
export default function ItemList({ items, onToggle, onMove }: ItemListProps) {
  const [view, setView] = useDropped(items);
  const sensors = useDragSensors();

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const key = keyForMove(view, String(active.id), String(over.id));
    if (key == null) return;
    const from = view.findIndex((i) => i.id === active.id);
    const to = view.findIndex((i) => i.id === over.id);
    setView((v) => arrayMove(v, from, to));
    onMove(String(active.id), key);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={view.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul>
          {view.map((item) => (
            <SortableShoppingItem key={item.id} item={item} onToggle={() => onToggle(item)} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
