import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical } from '@tabler/icons-react';
import type { ShoppingItem } from '../types';
import ChecklistItem from './ChecklistItem';

interface SortableShoppingItemProps {
  item: ShoppingItem;
  onToggle: () => void;
  onRemove: () => void;
}

/** A shopping-list row wired for drag reordering: dragging the left handle moves
 *  it; the rest of the row toggles / removes as usual. */
export default function SortableShoppingItem({
  item,
  onToggle,
  onRemove,
}: SortableShoppingItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <ChecklistItem
      checked={item.checked}
      label={item.name}
      onToggle={onToggle}
      onRemove={onRemove}
      toggleLabel={item.checked ? 'Marcar como pendiente' : 'Marcar como comprado'}
      removeLabel="Eliminar"
      containerRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      dragging={isDragging}
      dragHandle={
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Reordenar"
          title="Reordenar"
          className="flex shrink-0 cursor-grab touch-none items-center pl-3 pr-1 text-muted transition-colors hover:text-muted-strong"
        >
          <IconGripVertical size={18} stroke={1.5} />
        </button>
      }
    />
  );
}
