import { useState, type FormEvent } from 'react';
import {
  IconPlus,
  IconCheck,
  IconTrash,
  IconCalendarEvent,
  IconWifiOff,
} from '@tabler/icons-react';
import type { Chore } from '../types';
import { useChores } from '../hooks/useChores';
import { useOnline } from '../hooks/useOnline';
import { formatDateShort } from '../utils/dateUtils';

/** Today as an ISO date string (yyyy-mm-dd) in local time. */
function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function ChoresPage() {
  const online = useOnline();
  const { items: chores, loading, error, add, toggleDone, remove } = useChores();

  const [newTitle, setNewTitle] = useState('');
  const [newDueOn, setNewDueOn] = useState('');

  function addChore(e: FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle('');
    setNewDueOn('');
    void add(title, newDueOn || null);
  }

  const today = todayIso();

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold tracking-tight">Tareas</h1>

      <form
        onSubmit={addChore}
        className="mb-6 rounded-2xl border border-border bg-surface-raised p-3 shadow-sm"
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Agregar una tarea..."
          className="w-full bg-transparent px-2 py-2 text-base outline-none placeholder:text-muted"
        />
        <div className="mt-1 flex items-center gap-2 border-t border-border-subtle pt-2">
          <label className="flex items-center gap-1.5 text-sm text-muted">
            <IconCalendarEvent size={18} stroke={1.5} />
            <input
              type="date"
              value={newDueOn}
              onChange={(e) => setNewDueOn(e.target.value)}
              aria-label="Fecha límite"
              className="bg-transparent text-sm text-muted-strong outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:bg-disabled"
          >
            <IconPlus size={18} stroke={2} />
            Agregar
          </button>
        </div>
      </form>

      {!online && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-muted-strong">
          <IconWifiOff size={18} stroke={1.5} className="shrink-0 text-warning" />
          Sin conexión — se guarda acá y se sincroniza solo cuando vuelva.
        </div>
      )}

      {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}

      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : chores.length === 0 ? (
        <p className="py-10 text-center text-muted">
          No hay tareas. ¡Todo al día!
        </p>
      ) : (
        <ul className="space-y-2">
          {chores.map((chore: Chore) => {
            const overdue = !chore.done && chore.due_on != null && chore.due_on < today;
            return (
              <li
                key={chore.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised px-3 py-3 shadow-sm"
              >
                <button
                  onClick={() => void toggleDone(chore)}
                  aria-label={chore.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
                  title={chore.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    chore.done
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-neutral-hover text-transparent hover:border-primary'
                  }`}
                >
                  <IconCheck size={14} stroke={3} />
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate ${
                      chore.done ? 'text-muted line-through' : 'text-on-surface'
                    }`}
                  >
                    {chore.title}
                  </p>
                  {chore.due_on && (
                    <span
                      className={`mt-0.5 inline-flex items-center gap-1 text-xs ${
                        overdue ? 'text-error' : 'text-muted'
                      }`}
                    >
                      <IconCalendarEvent size={13} stroke={1.5} />
                      {formatDateShort(chore.due_on)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => void remove(chore)}
                  aria-label="Eliminar tarea"
                  title="Eliminar tarea"
                  className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-border-subtle hover:text-error"
                >
                  <IconTrash size={18} stroke={1.5} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
