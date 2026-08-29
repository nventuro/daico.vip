import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ShoppingItem } from '../../lib/offline/specs';
import { useShoppingList } from './useShoppingList';
import { keyForMove } from './ordering';
import { UNDO_MS, useUndo } from '../../hooks/useUndo';
import SortableShoppingItem from './SortableShoppingItem';
import AddBar from '../../components/AddBar';
import Button from '../../components/Button';
import UndoBar from '../../components/UndoBar';
import EmptyState from '../../components/EmptyState';
import ListPage from '../../components/ListPage';
import SkeletonRows from '../../components/SkeletonRows';

export default function ShoppingPage() {
  const { items, loading, error, add, toggle, removeChecked, restore, move } = useShoppingList();
  const undo = useUndo<ShoppingItem[]>(UNDO_MS);

  // Optimistic ordering: a drag reorder is reflected here synchronously so the
  // dropped row stays in its new slot, instead of snapping back for a frame
  // until the async local-store write lands (which read as a jiggle). When the
  // store update arrives it carries the same order, so nothing moves — and it
  // is adopted while rendering, which is what keeps that frame from showing.
  const [view, setView] = useState(items);
  const [syncedItems, setSyncedItems] = useState(items);
  if (syncedItems !== items) {
    setSyncedItems(items);
    setView(items);
  }

  const sensors = useSensors(
    // A small drag threshold so a tap on the handle never starts an accidental drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const key = keyForMove(view, String(active.id), String(over.id));
    if (key == null) return;
    const from = view.findIndex((i) => i.id === active.id);
    const to = view.findIndex((i) => i.id === over.id);
    setView((v) => arrayMove(v, from, to));
    void move(String(active.id), key);
  }

  async function clearStruck() {
    const removed = await removeChecked();
    if (removed?.length) undo.offer(removed);
  }

  function undoClear(removed: ShoppingItem[]) {
    undo.clear();
    void restore(removed);
  }

  const hasStruck = view.some((i) => i.checked);
  const justCleared = undo.value;

  return (
    <ListPage
      loading={loading}
      error={error}
      skeleton={<SkeletonRows leading="check" />}
      bar={
        <AddBar
          onAdd={(name) => void add(name)}
          placeholder="Agregar producto..."
          inputLabel="Nuevo producto"
          notice={
            justCleared ? (
              <UndoBar message="Tachados borrados" onAction={() => undoClear(justCleared)} />
            ) : hasStruck ? (
              <Button variant="dangerOutline" size="sm" onClick={() => void clearStruck()}>
                Borrar tachados
              </Button>
            ) : undefined
          }
        />
      }
    >
      {view.length === 0 ? (
        <EmptyState>La lista está vacía. Agregá lo que necesites comprar.</EmptyState>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={view.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul>
              {view.map((item) => (
                <SortableShoppingItem
                  key={item.id}
                  item={item}
                  onToggle={() => void toggle(item)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </ListPage>
  );
}
