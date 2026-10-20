import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { IconGripVertical } from '@tabler/icons-react';
import IconButton from '../../components/IconButton';

interface SectionHandleProps {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
}

/** What a section is dragged by: the end of its heading's hairline, across
 *  from where an item's handle is, so the two are never mistaken. */
export default function SectionHandle({ attributes, listeners }: SectionHandleProps) {
  return (
    <IconButton
      {...attributes}
      {...listeners}
      label="Reordenar sección"
      icon={IconGripVertical}
      size={18}
      className="cursor-grab touch-none py-1.5 pl-2"
    />
  );
}
