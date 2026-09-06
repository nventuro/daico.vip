import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical } from '@tabler/icons-react';
import type { ShoppingItem } from '../../lib/offline/specs';
import ChecklistItem from '../../components/ChecklistItem';
import IconButton from '../../components/IconButton';

interface SortableShoppingItemProps {
  item: ShoppingItem;
  onToggle: () => void;
}

/** A shopping-list row wired for drag reordering: dragging the left handle moves
 *  it; a tap anywhere else strikes the item through, or un-strikes it. */
export default function SortableShoppingItem({ item, onToggle }: SortableShoppingItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <ChecklistItem
      checked={item.checked}
      label={item.name}
      showCheck={false}
      onToggle={onToggle}
      toggleLabel={item.checked ? 'Destachar' : 'Tachar'}
      containerRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      dragging={isDragging}
      dragHandle={
        <IconButton
          {...attributes}
          {...listeners}
          label="Reordenar"
          icon={IconGripVertical}
          size={18}
          className="cursor-grab touch-none pr-1"
        />
      }
    />
  );
}
