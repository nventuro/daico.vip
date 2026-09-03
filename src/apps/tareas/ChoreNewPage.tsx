import { useState, type FormEvent } from 'react';
import Body from '../../components/editor/Body';
import ErrorLine from '../../components/ErrorLine';
import FormField from '../../components/FormField';
import FormFooter from '../../components/FormFooter';
import TitleField from '../../components/TitleField';
import { useDraftTitle } from '../../hooks/useDraftTitle';
import { useLeave } from '../../hooks/useLeave';
import { todayIso } from '../../utils/dateUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { entryPath } from '../types';
import DueDateChips from './DueDateChips';
import RepeatFields, { type RepeatValue } from './RepeatFields';
import { useChores } from './useChores';

/** What a chore starts as: done once, on no day in particular. */
const NEW_REPEAT: RepeatValue = { repeat_every: null, repeat_unit: null, repeat_from: null };

/** Where a chore is born: everything about it, written nowhere until Guardar,
 *  which opens the chore where it is then edited in place. */
export default function ChoreNewPage() {
  const { error, add } = useChores();
  const leave = useLeave();
  const draft = useDraftTitle();
  const [title, setTitle] = useState(draft);
  const [dueOn, setDueOn] = useState<string | null>(null);
  const [repeat, setRepeat] = useState<RepeatValue>(NEW_REPEAT);
  const [comments, setComments] = useState('');
  const today = todayIso();
  const repeats = repeat.repeat_every !== null;
  const name = lowercaseTrimmed(title);

  // A chore that comes back has to come back on a day, so switching it on
  // gives an undated chore today's date rather than leaving it without one.
  function changeRepeat(patch: RepeatValue) {
    setRepeat(patch);
    if (patch.repeat_every !== null && dueOn === null) setDueOn(today);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name) return;
    const id = await add({
      title: name,
      due_on: dueOn,
      comments: comments.trim() || null,
      ...repeat,
    });
    if (id) leave(entryPath('tareas', id));
  }

  return (
    <>
      <ErrorLine error={error} className="mb-4" />
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <TitleField value={title} onChange={setTitle} />

        <FormField label={repeats ? 'Próxima' : 'Fecha'} group>
          <DueDateChips value={dueOn} onChange={setDueOn} today={today} required={repeats} />
        </FormField>

        <RepeatFields value={repeat} onChange={changeRepeat} lastDoneOn={null} />

        <FormField label="Comentarios" group>
          <Body value="" onChange={setComments} placeholder="Comentarios" ariaLabel="Comentarios" />
        </FormField>

        <FormFooter submitDisabled={!name} />
      </form>
    </>
  );
}
