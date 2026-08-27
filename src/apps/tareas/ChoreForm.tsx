import { type FormEvent, useState } from 'react';
import type { Chore } from '../../types';
import { formatDate, todayIso } from '../../utils/dateUtils';
import { hasChanges } from '../../utils/formUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
import FormField from '../../components/FormField';
import TextInput from '../../components/TextInput';
import TextArea from '../../components/TextArea';
import FormFooter from '../../components/FormFooter';
import type { ChoreInput } from './useChores';
import DueDateChips from './DueDateChips';

interface ChoreFormProps {
  chore: Chore;
  onSave: (input: ChoreInput) => void;
  onRemove: () => void;
}

/** Edits every field of one chore. Keyed by the chore's id by its caller, so
 *  the local draft starts from the chore once and never chases it afterwards. */
export default function ChoreForm({ chore, onSave, onRemove }: ChoreFormProps) {
  const [title, setTitle] = useState(chore.title);
  const [dueOn, setDueOn] = useState<string | null>(chore.due_on);
  const [notes, setNotes] = useState(chore.notes ?? '');
  const today = todayIso();

  const input: ChoreInput = {
    title: lowercaseTrimmed(title),
    due_on: dueOn,
    notes: notes.trim() || null,
  };
  const canSave = input.title !== '' && hasChanges(input, chore);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onSave(input);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Título">
        <TextInput
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Título"
          autoCapitalize="none"
          required
        />
      </FormField>

      <FormField label="Fecha" group>
        <DueDateChips value={dueOn} onChange={setDueOn} today={today} />
        <p className="text-sm text-muted-strong">
          {dueOn ? formatDate(dueOn) : 'Sin fecha límite'}
        </p>
      </FormField>

      <FormField label="Notas">
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          aria-label="Notas"
          rows={5}
        />
      </FormField>

      <FormFooter
        removeLabel="Eliminar tarea"
        confirmQuestion="¿Eliminar la tarea?"
        onRemove={onRemove}
        submitDisabled={!canSave}
      />
    </form>
  );
}
