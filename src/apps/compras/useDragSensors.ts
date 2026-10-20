import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

/** How a row of the shopping list is picked up: by its handle, with the
 *  pointer or the keyboard. */
export function useDragSensors() {
  return useSensors(
    // A small drag threshold so a tap on the handle never starts an accidental drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}
