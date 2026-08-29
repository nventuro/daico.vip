import { useState } from 'react';
import type { Chore } from '../../lib/offline/specs';
import { todayIso } from '../../utils/dateUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { entryForm } from '../../utils/formUtils';
import FormField from '../../components/FormField';
import TitleField from '../../components/TitleField';
import NotesField from '../../components/NotesField';
import FormFooter from '../../components/FormFooter';
import AttachmentGrid from '../../components/AttachmentGrid';
import { entryPath } from '../types';
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
  const { canSave, onSubmit } = entryForm(input, chore, onSave, input.title !== '');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TitleField value={title} onChange={setTitle} />

      <FormField label="Fecha" group>
        <DueDateChips value={dueOn} onChange={setDueOn} today={today} />
      </FormField>

      <NotesField value={notes} onChange={setNotes} />

      <FormField label="Adjuntos" group>
        <AttachmentGrid
          owner={{ kind: 'chore', id: chore.id }}
          ownerPath={entryPath('tareas', chore.id)}
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
