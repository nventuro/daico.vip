import { useState } from 'react';
import type { Checkup } from '../../lib/offline/specs';
import AttachmentGrid from '../../components/AttachmentGrid';
import CheckRow from '../../components/CheckRow';
import { StaticChip } from '../../components/Chip';
import Comments from '../../components/Comments';
import DeleteDialog from '../../components/DeleteDialog';
import DueDateChips from '../../components/DueDateChips';
import EntryHead from '../../components/EntryHead';
import FormField from '../../components/FormField';
import SectionLabel from '../../components/SectionLabel';
import { useAttachments } from '../../hooks/useAttachments';
import { useLeave, useLeaveBack } from '../../hooks/useLeave';
import { useTextSave } from '../../hooks/useTextSave';
import { offerUndo } from '../../lib/undo';
import { appPath, entryPath } from '../types';
import { SALUD_KIND_LABELS } from './kinds';
import { isDone, markMessage } from './recurrence';
import RepeatFields, { type RepeatValue } from './RepeatFields';
import type { CheckupInput } from './useCheckups';
import { useToday } from '../../hooks/useToday';

interface CheckupPageProps {
  checkup: Checkup;
  /** The name of the pet it belongs to; null for a member's own, which says
   *  nothing of whose it is. */
  petName: string | null;
  save: (id: string, patch: Partial<CheckupInput>) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  mark: (checkup: Checkup) => Promise<unknown>;
  unmark: (id: string) => Promise<unknown>;
  /** Puts back what `mark` wrote over, from a copy taken before it. */
  restore: (checkup: Checkup) => Promise<unknown>;
}

/** A checkup, read and written on the same page: the title on blur, each
 *  control as it changes, the comments a moment after typing stops and on
 *  leaving. The one control that leaves the page is the square that marks
 *  it. Its files are what the check needs — the orden, the turno's
 *  confirmation — so a checkup that repeats keeps them from one time to the
 *  next; what a check found is kept as a study. */
export default function CheckupPage({
  checkup,
  petName,
  save,
  remove,
  mark,
  unmark,
  restore,
}: CheckupPageProps) {
  const attachments = useAttachments({ kind: 'checkup', id: checkup.id });
  const leave = useLeave();
  const leaveBack = useLeaveBack();
  const [deleting, setDeleting] = useState(false);
  const today = useToday();
  const repeats = checkup.repeat_every !== null;
  const labels = SALUD_KIND_LABELS.checkup;

  const commentsSave = useTextSave(async (text) => {
    await save(checkup.id, { comments: text || null });
  }, checkup.id);

  // A checkup that comes back has to come back on a day, so switching it on
  // gives an undated one today's date rather than leaving it without one.
  function changeRepeat(patch: RepeatValue) {
    const dated = patch.repeat_every !== null && checkup.due_on === null;
    void save(checkup.id, dated ? { ...patch, due_on: today } : patch);
  }

  /** Marks the checkup as the list does, or takes its mark off, and leaves
   *  the page: the list — or Próximo, or wherever the page was opened from —
   *  is where the checkup's new place and the undo are shown. */
  function toggleDone() {
    if (isDone(checkup)) {
      void unmark(checkup.id);
    } else {
      void mark(checkup);
      offerUndo({ message: markMessage(checkup, today), undo: () => restore(checkup) });
    }
    leaveBack(appPath('salud'));
  }

  async function removeCheckup() {
    // The checkup's files go with it; nothing else would ever list them.
    await attachments.removeAll();
    await remove(checkup.id);
    leave(appPath('salud'));
  }

  return (
    <article className="flex flex-col gap-4">
      <EntryHead
        title={checkup.title}
        onTitle={(title) => void save(checkup.id, { title })}
        chips={
          <>
            <StaticChip>{labels.one}</StaticChip>
            {petName !== null && <StaticChip>{petName}</StaticChip>}
          </>
        }
        onDelete={() => setDeleting(true)}
        deleteLabel={labels.remove}
      />

      <CheckRow checked={isDone(checkup)} onToggle={toggleDone} className="py-2">
        {isDone(checkup) ? 'Hecho' : 'Marcar como hecho'}
      </CheckRow>

      <FormField label={repeats ? 'Próximo' : 'Fecha'} group>
        <DueDateChips
          value={checkup.due_on}
          onChange={(dueOn) => void save(checkup.id, { due_on: dueOn })}
          today={today}
          required={repeats}
        />
      </FormField>

      <RepeatFields
        value={{ repeat_every: checkup.repeat_every, repeat_unit: checkup.repeat_unit }}
        onChange={changeRepeat}
        lastDoneOn={checkup.last_done_on}
      />

      <Comments value={checkup.comments ?? ''} onChange={commentsSave.onChange} />

      <div>
        <SectionLabel>Adjuntos</SectionLabel>
        <AttachmentGrid
          owner={{ kind: 'checkup', id: checkup.id }}
          ownerPath={entryPath('salud', checkup.id)}
        />
      </div>

      <DeleteDialog
        open={deleting}
        question={labels.question}
        onCancel={() => setDeleting(false)}
        onConfirm={() => void removeCheckup()}
      />
    </article>
  );
}
