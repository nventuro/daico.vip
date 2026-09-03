import { useState } from 'react';
import type { Checkup } from '../../lib/offline/specs';
import { StaticChip } from '../../components/Chip';
import DeleteDialog from '../../components/DeleteDialog';
import DueDateChips from '../../components/DueDateChips';
import Body from '../../components/editor/Body';
import EntryHead from '../../components/EntryHead';
import FormField from '../../components/FormField';
import { useLeave } from '../../hooks/useLeave';
import { useTextSave } from '../../hooks/useTextSave';
import { todayIso } from '../../utils/dateUtils';
import { appPath } from '../types';
import { SALUD_KIND_LABELS } from './kinds';
import RepeatFields, { type RepeatValue } from './RepeatFields';
import type { CheckupInput } from './useCheckups';

interface CheckupPageProps {
  checkup: Checkup;
  save: (id: string, patch: Partial<CheckupInput>) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
}

/** A checkup, read and written on the same page: the title on blur, each
 *  control as it changes, the comments a moment after typing stops and on
 *  leaving. No pictures: the row re-dates itself, and a picture pinned to it
 *  would outlive the check it was about — what was done is kept as a study. */
export default function CheckupPage({ checkup, save, remove }: CheckupPageProps) {
  const leave = useLeave();
  const [deleting, setDeleting] = useState(false);
  const today = todayIso();
  const repeats = checkup.repeat_every !== null;
  const labels = SALUD_KIND_LABELS.checkup;

  const commentsSave = useTextSave(async (text) => {
    await save(checkup.id, { comments: text || null });
  });

  // A checkup that comes back has to come back on a day, so switching it on
  // gives an undated one today's date rather than leaving it without one.
  function changeRepeat(patch: RepeatValue) {
    const dated = patch.repeat_every !== null && checkup.due_on === null;
    void save(checkup.id, dated ? { ...patch, due_on: today } : patch);
  }

  async function removeCheckup() {
    await remove(checkup.id);
    leave(appPath('salud'));
  }

  return (
    <article className="flex flex-col gap-4">
      <EntryHead
        title={checkup.title}
        onTitle={(title) => void save(checkup.id, { title })}
        chips={<StaticChip>{labels.one}</StaticChip>}
        onDelete={() => setDeleting(true)}
        deleteLabel={labels.remove}
      />

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

      <Body
        value={checkup.comments ?? ''}
        onChange={commentsSave.onChange}
        placeholder="Comentarios"
        ariaLabel="Comentarios"
      />

      <DeleteDialog
        open={deleting}
        question={labels.question}
        onCancel={() => setDeleting(false)}
        onConfirm={() => void removeCheckup()}
      />
    </article>
  );
}
