import { useMemo, useState } from 'react';
import type { Chore } from '../../lib/offline/specs';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import { useChores } from './useChores';
import { formatDayMonth, isPast, relativeDay, todayIso } from '../../utils/dateUtils';
import { UNDO_MS, useUndo } from '../../hooks/useUndo';
import ChecklistItem from '../../components/ChecklistItem';
import EntryMarks from '../../components/EntryMarks';
import CompletedSection from '../../components/CompletedSection';
import SectionLabel from '../../components/SectionLabel';
import AddBar from '../../components/AddBar';
import UndoBar from '../../components/UndoBar';
import EmptyState from '../../components/EmptyState';
import ListPage from '../../components/ListPage';
import SkeletonRows from '../../components/SkeletonRows';
import DueDateChips from './DueDateChips';
import { entryPath } from '../types';
import { choreMarks } from './marks';
import { dueAfterMarking, groupChores, isDone } from './recurrence';

export default function ChoresPage() {
  const { items: chores, loading, error, add, mark, unmark, restore } = useChores();
  const { items: attachments } = useAttachments();
  const attached = useMemo(() => ownersWithAttachments(attachments, 'chore'), [attachments]);
  const undo = useUndo<Chore>(UNDO_MS);

  const today = todayIso();
  const { soon, later, done } = useMemo(() => groupChores(chores, today), [chores, today]);

  // The next chore is rarely due the same day as the last one.
  const [dueOn, setDueOn] = useState<string | null>(null);

  function addChore(title: string) {
    void add(title, dueOn);
    setDueOn(null);
  }

  function toggle(chore: Chore) {
    if (isDone(chore)) {
      void unmark(chore.id);
      return;
    }
    void mark(chore);
    // The copy is taken before the mark, so undoing puts back both the day it
    // was last marked and the day it was due.
    undo.offer(chore);
  }

  function undoMark(chore: Chore) {
    undo.clear();
    void restore(chore);
  }

  /** What the undo bar says: for a chore that comes back, where it went. */
  function markMessage(chore: Chore): string {
    const next = chore.repeat_every === null ? null : dueAfterMarking(chore, today);
    return next ? `Hecha · vuelve el ${formatDayMonth(next)}` : 'Tarea hecha';
  }

  const justDone = undo.value;

  function renderChore(chore: Chore) {
    const finished = isDone(chore);
    const overdue = !finished && chore.due_on != null && isPast(chore.due_on, today);
    return (
      <ChecklistItem
        key={chore.id}
        checked={finished}
        label={chore.title}
        to={entryPath('tareas', chore.id)}
        subtitle={chore.due_on ? relativeDay(today, chore.due_on) : undefined}
        overdue={overdue}
        trailing={<EntryMarks marks={choreMarks(chore, attached.has(chore.id))} />}
        onToggle={() => toggle(chore)}
        toggleLabel={finished ? 'Marcar como pendiente' : 'Marcar como hecha'}
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
          notice={
            justDone && (
              <UndoBar message={markMessage(justDone)} onAction={() => undoMark(justDone)} />
            )
          }
        >
          <DueDateChips value={dueOn} onChange={setDueOn} today={today} />
        </AddBar>
      }
    >
      {soon.length === 0 && later.length === 0 && (
        <EmptyState>No hay tareas. ¡Todo al día!</EmptyState>
      )}
      {soon.length > 0 && <ul>{soon.map(renderChore)}</ul>}
      {later.length > 0 && (
        <section className="mt-6">
          <SectionLabel>Más adelante</SectionLabel>
          <ul>{later.map(renderChore)}</ul>
        </section>
      )}
      <CompletedSection label="Hechas" count={done.length}>
        {done.map(renderChore)}
      </CompletedSection>
    </ListPage>
  );
}
