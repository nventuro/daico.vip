import { useMemo, useState } from 'react';
import type { Chore } from '../../lib/offline/specs';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import { useChores } from './useChores';
import { isPast, relativeDay, todayIso } from '../../utils/dateUtils';
import { UNDO_MS, useUndo } from '../../hooks/useUndo';
import ChecklistItem from '../../components/ChecklistItem';
import EntryMarks from '../../components/EntryMarks';
import CompletedSection from '../../components/CompletedSection';
import AddBar from '../../components/AddBar';
import UndoBar from '../../components/UndoBar';
import EmptyState from '../../components/EmptyState';
import ListPage from '../../components/ListPage';
import SkeletonRows from '../../components/SkeletonRows';
import DueDateChips from './DueDateChips';
import { entryPath } from '../types';
import { choreMarks } from './marks';

export default function ChoresPage() {
  const { items: chores, loading, error, add, setDone } = useChores();
  const { items: attachments } = useAttachments();
  const attached = useMemo(() => ownersWithAttachments(attachments, 'chore'), [attachments]);
  const undo = useUndo<Chore>(UNDO_MS);

  const today = todayIso();
  // The next chore is rarely due the same day as the last one.
  const [dueOn, setDueOn] = useState<string | null>(null);

  function addChore(title: string) {
    void add(title, dueOn);
    setDueOn(null);
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
    const overdue = !chore.done && chore.due_on != null && isPast(chore.due_on, today);
    return (
      <ChecklistItem
        key={chore.id}
        checked={chore.done}
        label={chore.title}
        to={entryPath('tareas', chore.id)}
        subtitle={chore.due_on ? relativeDay(today, chore.due_on) : undefined}
        overdue={overdue}
        trailing={<EntryMarks marks={choreMarks(chore, attached.has(chore.id))} />}
        onToggle={() => toggle(chore)}
        toggleLabel={chore.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
      />
    );
  }

  return (
    <ListPage
      loading={loading}
      error={error}
      skeleton={<SkeletonRows leading="check" subtitle />}
      bar={
        <AddBar
          onAdd={addChore}
          placeholder="Agregar una tarea..."
          inputLabel="Nueva tarea"
          notice={justDone && <UndoBar message="Tarea hecha" onAction={() => undoDone(justDone)} />}
        >
          <DueDateChips value={dueOn} onChange={setDueOn} today={today} />
        </AddBar>
      }
    >
      {active.length === 0 ? (
        <EmptyState>No hay tareas. ¡Todo al día!</EmptyState>
      ) : (
        <ul>{active.map(renderChore)}</ul>
      )}
      <CompletedSection label="Hechas" count={completed.length}>
        {completed.map(renderChore)}
      </CompletedSection>
    </ListPage>
  );
}
