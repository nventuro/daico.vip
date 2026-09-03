import { useRef, useState, type FormEvent } from 'react';
import Body from '../../components/editor/Body';
import ErrorLine from '../../components/ErrorLine';
import FormField from '../../components/FormField';
import FormFooter from '../../components/FormFooter';
import TitleField from '../../components/TitleField';
import { useDraftTitle } from '../../hooks/useDraftTitle';
import { useLeave } from '../../hooks/useLeave';
import { useMasterKey } from '../../hooks/useMasterKey';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { entryPath } from '../types';
import { useNotes } from './useNotes';

/** Where a note is born: its title and what it says, written nowhere until
 *  Guardar, which opens the note where it is then written on in place. */
export default function NoteNewPage() {
  const { error, add } = useNotes();
  const masterKey = useMasterKey();
  const leave = useLeave();
  const draft = useDraftTitle();
  const [title, setTitle] = useState(draft);
  // What is typed stays the editor's until Guardar: nothing here is redrawn
  // on a keystroke.
  const text = useRef('');

  const name = lowercaseTrimmed(title);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name || masterKey.status !== 'unlocked') return;
    const id = await add(name, text.current, masterKey.key);
    if (id) leave(entryPath('notas', id));
  }

  return (
    <>
      <ErrorLine error={error} className="mb-4" />
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <TitleField value={title} onChange={setTitle} />

        <FormField label="Contenido" group>
          <Body
            value=""
            onChange={(written) => {
              text.current = written;
            }}
            placeholder="Contenido"
            ariaLabel="Contenido"
            autoFocus
          />
        </FormField>

        <FormFooter submitDisabled={!name} />
      </form>
    </>
  );
}
