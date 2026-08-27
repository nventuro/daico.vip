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
import { UNDO_MS, type ShoppingItem } from '../../types';
import { useShoppingList } from './useShoppingList';
import { keyForMove } from '../../lib/ordering';
import { useUndo } from '../../hooks/useUndo';
import OfflineBanner from '../../components/OfflineBanner';
import SortableShoppingItem from './SortableShoppingItem';
import AddBar from '../../components/AddBar';
import Button from '../../components/Button';
import UndoBar from '../../components/UndoBar';

export default function ShoppingPage() {
  const { items, loading, error, add, toggle, removeChecked, restore, move } = useShoppingList();
  const [name, setName] = useState('');
  const undo = useUndo<ShoppingItem[]>(UNDO_MS);

  // Optimistic ordering: a drag reorder is reflected here synchronously so the
  // dropped row stays in its new slot, instead of snapping back for a frame
  // until the async local-store write lands (which read as a jiggle). When the
  // store update arrives it carries the same order, so nothing moves. Adopting
  // the canonical list during render (vs. an effect) avoids a flash and the
  // "you might not need an effect" cascade.
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

  function submit() {
    const value = name.trim();
    if (!value) return;
    setName(''); // keep focus so several items can be added in a row
    void add(value);
  }

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
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        <OfflineBanner />

        {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}

        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : view.length === 0 ? (
          <p className="py-10 text-center text-muted">
            La lista está vacía. Agregá lo que necesites comprar.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
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
      </div>

      <AddBar
        value={name}
        onChange={setName}
        onSubmit={submit}
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
    </div>
  );
}
