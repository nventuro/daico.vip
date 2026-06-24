import { useState, type FormEvent } from 'react';
import { IconPlus, IconCheck, IconTrash, IconWifiOff } from '@tabler/icons-react';
import { useShoppingList } from '../hooks/useShoppingList';
import { useOnline } from '../hooks/useOnline';

export default function ShoppingPage() {
  const online = useOnline();
  const { items, loading, error, add, toggle, remove, clearChecked } = useShoppingList();
  const [name, setName] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    setName(''); // keep focus so several items can be added in a row
    void add(value);
  }

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Compras</h1>
          {checkedCount > 0 && (
            <button
              onClick={() => void clearChecked()}
              className="shrink-0 text-sm font-medium text-muted transition-colors hover:text-error"
            >
              Limpiar comprados
            </button>
          )}
        </div>

        {!online && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-muted-strong">
            <IconWifiOff size={18} stroke={1.5} className="shrink-0 text-warning" />
            Sin conexión — se guarda acá y se sincroniza solo cuando vuelva.
          </div>
        )}

        {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}

        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-muted">
            La lista está vacía. Agregá lo que necesites comprar.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-stretch rounded-xl border border-border bg-surface-raised shadow-sm"
              >
                <button
                  onClick={() => void toggle(item)}
                  aria-label={item.checked ? 'Marcar como pendiente' : 'Marcar como comprado'}
                  className="flex flex-1 items-center gap-3 px-3 py-3 text-left"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      item.checked
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-neutral-hover text-transparent'
                    }`}
                  >
                    <IconCheck size={14} stroke={3} />
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate ${
                      item.checked ? 'text-muted line-through' : 'text-on-surface'
                    }`}
                  >
                    {item.name}
                  </span>
                </button>
                <button
                  onClick={() => void remove(item)}
                  aria-label="Eliminar"
                  title="Eliminar"
                  className="flex shrink-0 items-center px-3 text-muted transition-colors hover:text-error"
                >
                  <IconTrash size={18} stroke={1.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom-anchored add bar — within thumb reach for one-handed use. */}
      <form
        onSubmit={submit}
        className="sticky bottom-0 -mx-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Agregar producto..."
            aria-label="Nuevo producto"
            enterKeyHint="done"
            autoCapitalize="sentences"
            className="flex-1 rounded-full border border-border bg-surface-raised px-4 py-3 text-base outline-none transition-colors placeholder:text-muted focus:border-primary"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            aria-label="Agregar"
            title="Agregar"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-hover disabled:bg-disabled"
          >
            <IconPlus size={22} stroke={2} />
          </button>
        </div>
      </form>
    </div>
  );
}
