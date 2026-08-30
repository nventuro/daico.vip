import { useState } from 'react';
import type { Note } from '../../lib/offline/specs';
import FormField from '../../components/FormField';
import FormFooter from '../../components/FormFooter';
import TextArea from '../../components/TextArea';
import TitleField from '../../components/TitleField';
import { CONTROL_CLASS } from '../../components/controlClasses';
import { entryForm } from '../../utils/formUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
import type { NoteInput } from './useNotes';

interface NoteFormProps {
  note: Note;
  /** The note as it was opened; the form's draft starts from it. */
  text: string;
  onSave: (input: NoteInput) => void;
  onRemove: () => void;
}

/** Edits one note. Keyed by the note's id by its caller, so the local draft
 *  starts from the note once and never chases it afterwards. */
export default function NoteForm({ note, text, onSave, onRemove }: NoteFormProps) {
  const [title, setTitle] = useState(note.title);
  const [draft, setDraft] = useState(text);

  const input: NoteInput = { title: lowercaseTrimmed(title), text: draft };
  const { canSave, onSubmit } = entryForm(
    input,
    { title: note.title, text },
    onSave,
    input.title !== '',
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TitleField value={title} onChange={setTitle} />

      <FormField label="Nota (Markdown)">
        <TextArea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Nota (Markdown)"
          rows={16}
          className={`${CONTROL_CLASS} font-mono`}
        />
      </FormField>

      <FormFooter
        removeLabel="Eliminar nota"
        confirmQuestion="¿Eliminar la nota?"
        onRemove={onRemove}
        submitDisabled={!canSave}
      />
    </form>
  );
}
