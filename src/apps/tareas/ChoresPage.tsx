import { useMemo, useState } from 'react';
import { UNDO_MS, type Chore } from '../../types';
import { useChores } from './useChores';
import { useAttachments } from './useAttachments';
import { relativeDay, todayIso } from '../../utils/dateUtils';
import { useUndo } from '../../hooks/useUndo';
import OfflineBanner from '../../components/OfflineBanner';
import ChecklistItem from '../../components/ChecklistItem';
import EntryMarks from '../../components/EntryMarks';
import CompletedSection from '../../components/CompletedSection';
import AddBar from '../../components/AddBar';
import UndoBar from '../../components/UndoBar';
import DueDateChips from './DueDateChips';
import { choreMarks } from './marks';

export default function ChoresPage() {
  const { items: chores, loading, error, add, setDone } = useChores();
  const { items: attachments } = useAttachments();
  const attached = useMemo(() => new Set(attachments.map((a) => a.owner_id)), [attachments]);
  const undo = useUndo<Chore>(UNDO_MS);

  const today = todayIso();

  const [newTitle, setNewTitle] = useState('');
  const [newDueOn, setNewDueOn] = useState<string | null>(null);

  function addChore() {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle('');
    setNewDueOn(null);
    void add(title, newDueOn);
  }

  function toggle(chore: Chore) {
    void setDone(chore.id, !chore.done);
    if (!chore.done) undo.offer(chore);
  }

  function undoDone(chore: Chore) {
    undo.clear();
    void setDone(chore.id, false);
  }

  const active = chores.filter((c) => !c.done);
  const completed = chores.filter((c) => c.done);
  const justDone = undo.value;

  function renderChore(chore: Chore) {
    const overdue = !chore.done && chore.due_on != null && chore.due_on < today;
    return (
      <ChecklistItem
        key={chore.id}
        checked={chore.done}
        label={chore.title}
        to={`/tareas/${chore.id}`}
        subtitle={
          chore.due_on ? (
            <span className={`mt-0.5 text-xs ${overdue ? 'text-error' : 'text-muted'}`}>
              {relativeDay(today, chore.due_on)}
            </span>
          ) : undefined
        }
        trailing={<EntryMarks marks={choreMarks(chore, attached.has(chore.id))} />}
        onToggle={() => toggle(chore)}
        toggleLabel={chore.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        <OfflineBanner />

        {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}

        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : (
          <>
            {active.length === 0 ? (
              <p className="py-10 text-center text-muted">No hay tareas. ¡Todo al día!</p>
            ) : (
              <ul>{active.map(renderChore)}</ul>
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
        notice={justDone && <UndoBar message="Tarea hecha" onAction={() => undoDone(justDone)} />}
      >
        <DueDateChips value={newDueOn} onChange={setNewDueOn} today={today} />
      </AddBar>
    </div>
  );
}
