import { useState, type FormEvent } from 'react';
import Chip from '../../components/Chip';
import DatePicker from '../../components/DatePicker';
import DueDateChips from '../../components/DueDateChips';
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
import { SALUD_KINDS, SALUD_KIND_DEFAULT, SALUD_KIND_LABELS, type SaludKind } from './kinds';
import RepeatFields, { type RepeatValue } from './RepeatFields';
import { useCheckups } from './useCheckups';
import { useHealthRecords } from './useHealthRecords';

/** What a checkup starts as: done once, on no day in particular. */
const NEW_REPEAT: RepeatValue = { repeat_every: null, repeat_unit: null };

/** Where a checkup or a study is born: its kind chosen here and never again,
 *  everything about it written nowhere until Guardar, which opens the entry
 *  where it is then edited in place — a study, to have its pictures added. */
export default function SaludNewPage() {
  const checkups = useCheckups();
  const records = useHealthRecords();
  const leave = useLeave();
  const draft = useDraftTitle();
  const today = todayIso();
  const [title, setTitle] = useState(draft);
  const [kind, setKind] = useState<SaludKind>(SALUD_KIND_DEFAULT);
  const [dueOn, setDueOn] = useState<string | null>(null);
  const [repeat, setRepeat] = useState<RepeatValue>(NEW_REPEAT);
  const [comments, setComments] = useState('');
  // A study is entered the day its results come more often than any other day.
  const [onDate, setOnDate] = useState<string | null>(today);
  const name = lowercaseTrimmed(title);
  const repeats = repeat.repeat_every !== null;

  // A checkup that comes back has to come back on a day, so switching it on
  // gives an undated one today's date rather than leaving it without one.
  function changeRepeat(patch: RepeatValue) {
    setRepeat(patch);
    if (patch.repeat_every !== null && dueOn === null) setDueOn(today);
  }

  const complete = name !== '' && (kind === 'checkup' || onDate !== null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!complete) return;
    const id =
      kind === 'checkup'
        ? await checkups.add({
            title: name,
            due_on: dueOn,
            comments: comments.trim() || null,
            ...repeat,
          })
        : onDate !== null
          ? await records.add({ title: name, on_date: onDate })
          : undefined;
    if (id) leave(entryPath('salud', id));
  }

  return (
    <>
      <ErrorLine error={checkups.error ?? records.error} className="mb-4" />
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <TitleField value={title} onChange={setTitle} />

        <FormField label="Clase" group>
          <div className="flex flex-wrap items-center gap-2">
            {SALUD_KINDS.map((option) => (
              <Chip key={option} selected={kind === option} onClick={() => setKind(option)}>
                {SALUD_KIND_LABELS[option].one}
              </Chip>
            ))}
          </div>
        </FormField>

        {kind === 'checkup' ? (
          <>
            <FormField label={repeats ? 'Próximo' : 'Fecha'} group>
              <DueDateChips value={dueOn} onChange={setDueOn} today={today} required={repeats} />
            </FormField>

            <RepeatFields value={repeat} onChange={changeRepeat} lastDoneOn={null} />

            <FormField label="Comentarios" group>
              <Body
                value=""
                onChange={setComments}
                placeholder="Comentarios"
                ariaLabel="Comentarios"
              />
            </FormField>
          </>
        ) : (
          <FormField label="Fecha">
            <DatePicker value={onDate} onChange={setOnDate} label="Fecha" required />
          </FormField>
        )}

        <FormFooter submitDisabled={!complete} />
      </form>
    </>
  );
}
