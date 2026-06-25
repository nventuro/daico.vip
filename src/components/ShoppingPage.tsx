import { useState } from 'react';
import type { ShoppingItem } from '../types';
import { useShoppingList } from '../hooks/useShoppingList';
import OfflineBanner from './OfflineBanner';
import ChecklistItem from './ChecklistItem';
import CompletedSection from './CompletedSection';
import AddBar from './AddBar';

export default function ShoppingPage() {
  const { items, loading, error, add, toggle, remove } = useShoppingList();
  const [name, setName] = useState('');

  function submit() {
    const value = name.trim();
    if (!value) return;
    setName(''); // keep focus so several items can be added in a row
    void add(value);
  }

  const active = items.filter((i) => !i.checked);
  const completed = items.filter((i) => i.checked);

  function renderItem(item: ShoppingItem) {
    return (
      <ChecklistItem
        key={item.id}
        checked={item.checked}
        label={item.name}
        onToggle={() => void toggle(item)}
        onRemove={() => void remove(item)}
        toggleLabel={item.checked ? 'Marcar como pendiente' : 'Marcar como comprado'}
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
              <ul className="space-y-2">{active.map(renderItem)}</ul>
            )}
            <CompletedSection label="Compradas" count={completed.length}>
              {completed.map(renderItem)}
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
