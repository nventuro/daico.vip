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
import type { ShoppingItem } from '../types';
import { useShoppingList } from '../hooks/useShoppingList';
import { keyForMove } from '../lib/ordering';
import OfflineBanner from './OfflineBanner';
import ChecklistItem from './ChecklistItem';
import SortableShoppingItem from './SortableShoppingItem';
import CompletedSection from './CompletedSection';
import AddBar from './AddBar';

export default function ShoppingPage() {
  const { items, loading, error, add, toggle, remove, move } = useShoppingList();
  const [name, setName] = useState('');

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

  const active = view.filter((i) => !i.checked);
  const completed = view.filter((i) => i.checked);

  function handleDragEnd({ active: dragged, over }: DragEndEvent) {
    if (!over || dragged.id === over.id) return;
    const key = keyForMove(active, String(dragged.id), String(over.id));
    if (key == null) return;
    // Active items are the leading slice of `view` (sorted unchecked-first), so
    // their indices are valid indices into `view`.
    const from = active.findIndex((i) => i.id === dragged.id);
    const to = active.findIndex((i) => i.id === over.id);
    setView((v) => arrayMove(v, from, to));
    void move(String(dragged.id), key);
  }

  function renderCompleted(item: ShoppingItem) {
    return (
      <ChecklistItem
        key={item.id}
        checked={item.checked}
        label={item.name}
        onToggle={() => void toggle(item)}
        onRemove={() => void remove(item)}
        toggleLabel="Marcar como pendiente"
        removeLabel="Eliminar"
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Compras</h1>

        <OfflineBanner />

        {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}

        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : (
          <>
            {active.length === 0 ? (
              <p className="py-10 text-center text-muted">
                La lista está vacía. Agregá lo que necesites comprar.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={active.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-2">
                    {active.map((item) => (
                      <SortableShoppingItem
                        key={item.id}
                        item={item}
                        onToggle={() => void toggle(item)}
                        onRemove={() => void remove(item)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
            <CompletedSection label="Compradas" count={completed.length}>
              {completed.map(renderCompleted)}
            </CompletedSection>
          </>
        )}
      </div>

      <AddBar
        value={name}
        onChange={setName}
        onSubmit={submit}
        placeholder="Agregar producto..."
        inputLabel="Nuevo producto"
      />
    </div>
  );
}
