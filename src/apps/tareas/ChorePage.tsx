import { useState } from 'react';
import type { Chore } from '../../lib/offline/specs';
import AttachmentGrid from '../../components/AttachmentGrid';
import CheckRow from '../../components/CheckRow';
import Comments from '../../components/Comments';
import DeleteDialog from '../../components/DeleteDialog';
import DueDateChips from '../../components/DueDateChips';
import EntryHead from '../../components/EntryHead';
import EntryPage from '../../components/EntryPage';
import FormField from '../../components/FormField';
import SectionLabel from '../../components/SectionLabel';
import { useAttachments } from '../../hooks/useAttachments';
import { useEntry } from '../../hooks/useEntry';
import { useLeave, useLeaveBack } from '../../hooks/useLeave';
import { useTextSave } from '../../hooks/useTextSave';
import { offerUndo } from '../../lib/undo';
import { todayIso } from '../../utils/dateUtils';
import { appPath, entryPath } from '../types';
import { isDone, markMessage } from './recurrence';
import RepeatFields, { type RepeatValue } from './RepeatFields';
import { useChores } from './useChores';

/** A chore, read and written on the same page: the title on blur, each
 *  control as it changes, the comments a moment after typing stops and on
 *  leaving. The one control that leaves the page is the square that marks
 *  it. */
export default function ChorePage() {
  const { items, loading, error, save, remove, mark, unmark, restore } = useChores();
  const chore = useEntry(items);
  const attachments = useAttachments({ kind: 'chore', id: chore?.id ?? '' });
  const leave = useLeave();
  const leaveBack = useLeaveBack();
  const [deleting, setDeleting] = useState(false);
  const today = todayIso();

  const commentsSave = useTextSave(async (text) => {
    if (chore) await save(chore.id, { comments: text || null });
  });

  // A chore that comes back has to come back on a day, so switching it on
  // gives an undated chore today's date rather than leaving it without one.
  function changeRepeat(id: string, dueOn: string | null, patch: RepeatValue) {
    const dated = patch.repeat_every !== null && dueOn === null;
    void save(id, dated ? { ...patch, due_on: today } : patch);
  }

  /** Marks the chore as the list does, or takes its mark off, and leaves
   *  the page: the list — or Próximo, or wherever the page was opened from —
   *  is where the chore's new place and the undo are shown. */
  function toggleDone(chore: Chore) {
    if (isDone(chore)) {
      void unmark(chore.id);
    } else {
      void mark(chore);
      offerUndo({ message: markMessage(chore, today), undo: () => restore(chore) });
    }
    leaveBack(appPath('tareas'));
  }

  async function removeChore(id: string) {
    // The chore's attachments go with it; nothing else would ever list them.
    await attachments.removeAll();
    await remove(id);
    leave(appPath('tareas'));
  }

  return (
    <EntryPage entry={chore} loading={loading} error={error} missing="Tarea no encontrada.">
      {(chore) => {
        const repeats = chore.repeat_every !== null;
        return (
          <article key={chore.id} className="flex flex-col gap-4">
            <EntryHead
              title={chore.title}
              onTitle={(title) => void save(chore.id, { title })}
              onDelete={() => setDeleting(true)}
              deleteLabel="Eliminar tarea"
            />

            <CheckRow checked={isDone(chore)} onToggle={() => toggleDone(chore)} className="py-2">
              {isDone(chore) ? 'Hecha' : 'Marcar como hecha'}
            </CheckRow>

            <FormField label={repeats ? 'Próxima' : 'Fecha'} group>
              <DueDateChips
                value={chore.due_on}
                onChange={(dueOn) => void save(chore.id, { due_on: dueOn })}
                today={today}
                required={repeats}
              />
            </FormField>

            <RepeatFields
              value={{
                repeat_every: chore.repeat_every,
                repeat_unit: chore.repeat_unit,
                repeat_from: chore.repeat_from,
              }}
              onChange={(patch) => changeRepeat(chore.id, chore.due_on, patch)}
              lastDoneOn={chore.last_done_on}
            />

            <Comments value={chore.comments ?? ''} onChange={commentsSave.onChange} />

            <div>
              <SectionLabel>Adjuntos</SectionLabel>
              <AttachmentGrid
                owner={{ kind: 'chore', id: chore.id }}
                ownerPath={entryPath('tareas', chore.id)}
              />
            </div>

            <DeleteDialog
              open={deleting}
              question="¿Eliminar la tarea?"
              onCancel={() => setDeleting(false)}
              onConfirm={() => void removeChore(chore.id)}
            />
          </article>
        );
      }}
    </EntryPage>
  );
}
