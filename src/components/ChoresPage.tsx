import { useState } from 'react';
import { IconCalendarEvent } from '@tabler/icons-react';
import type { Chore } from '../types';
import { useChores } from '../hooks/useChores';
import { formatDateShort } from '../utils/dateUtils';
import OfflineBanner from './OfflineBanner';
import ChecklistItem from './ChecklistItem';
import CompletedSection from './CompletedSection';
import AddBar from './AddBar';

/** Today as an ISO date string (yyyy-mm-dd) in local time. */
function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function ChoresPage() {
  const { items: chores, loading, error, add, toggleDone, remove } = useChores();

  const today = todayIso();

  const [newTitle, setNewTitle] = useState('');
  const [newDueOn, setNewDueOn] = useState(today);

  function addChore() {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle('');
    setNewDueOn(today);
    void add(title, newDueOn || null);
  }

  const active = chores.filter((c) => !c.done);
  const completed = chores.filter((c) => c.done);

  function renderChore(chore: Chore) {
    const overdue = !chore.done && chore.due_on != null && chore.due_on < today;
    return (
      <ChecklistItem
        key={chore.id}
        checked={chore.done}
        label={chore.title}
        subtitle={
          chore.due_on ? (
            <span
              className={`mt-0.5 inline-flex items-center gap-1 text-xs ${
                overdue ? 'text-error' : 'text-muted'
              }`}
            >
              <IconCalendarEvent size={13} stroke={1.5} />
              {formatDateShort(chore.due_on)}
            </span>
          ) : undefined
        }
        onToggle={() => void toggleDone(chore)}
        onRemove={() => void remove(chore)}
        toggleLabel={chore.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
        removeLabel="Eliminar tarea"
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Tareas</h1>

        <OfflineBanner />

        {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}

        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : (
          <>
            {active.length === 0 ? (
              <p className="py-10 text-center text-muted">No hay tareas. ¡Todo al día!</p>
            ) : (
              <ul className="space-y-2">{active.map(renderChore)}</ul>
            )}
            <CompletedSection label="Hechas" count={completed.length}>
              {completed.map(renderChore)}
            </CompletedSection>
          </>
        )}
      </div>

      <AddBar
        value={newTitle}
        onChange={setNewTitle}
        onSubmit={addChore}
        placeholder="Agregar una tarea..."
        inputLabel="Nueva tarea"
      >
        <label className="flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-sm text-muted">
          <IconCalendarEvent size={18} stroke={1.5} />
          <input
            type="date"
            value={newDueOn}
            onChange={(e) => setNewDueOn(e.target.value)}
            aria-label="Fecha límite"
            className="bg-transparent text-sm text-muted-strong outline-none"
          />
        </label>
      </AddBar>
    </div>
  );
}
