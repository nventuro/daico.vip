import { useRef, useState } from 'react';
import AttachmentGrid from '../../components/AttachmentGrid';
import DeleteDialog from '../../components/DeleteDialog';
import Body, { type BodyHandle } from '../../components/editor/Body';
import EntryHead from '../../components/EntryHead';
import EntryPage from '../../components/EntryPage';
import LoadingLine from '../../components/LoadingLine';
import SectionLabel from '../../components/SectionLabel';
import { useEntry } from '../../hooks/useEntry';
import { useLeave } from '../../hooks/useLeave';
import { useMasterKey } from '../../hooks/useMasterKey';
import { useTextSave } from '../../hooks/useTextSave';
import { relativeDayTime, todayIso } from '../../utils/dateUtils';
import { appPath, entryPath } from '../types';
import { useNoteText } from './useNoteText';
import { useNotes } from './useNotes';

/** A note, read and written on the same page: the title on blur, the text a
 *  moment after typing stops and on leaving, each control as it changes. */
export default function NotePage() {
  const { items, loading, error, save, remove } = useNotes();
  const note = useEntry(items);
  const { text, error: bodyError } = useNoteText(note);
  const masterKey = useMasterKey();
  const key = masterKey.status === 'unlocked' ? masterKey.key : null;
  const leave = useLeave();
  const body = useRef<BodyHandle>(null);
  const [deleting, setDeleting] = useState(false);

  const textSave = useTextSave(async (written) => {
    if (note && key) await save(note.id, { text: written }, key);
  });

  async function removeNote(id: string) {
    await remove(id);
    leave(appPath('notas'));
  }

  return (
    <EntryPage
      entry={note}
      loading={loading}
      error={error ?? bodyError}
      missing="Nota no encontrada."
    >
      {(note) => (
        <article key={note.id} className="flex flex-col gap-4">
          <EntryHead
            title={note.title}
            onTitle={(title) => {
              if (key) void save(note.id, { title }, key);
            }}
            subtitle={`Editada ${relativeDayTime(todayIso(), note.updated_at)}`}
            onDelete={() => setDeleting(true)}
            deleteLabel="Eliminar nota"
            onEnter={() => body.current?.focus()}
          />

          {/* Reading a note is opening it: the body is sealed like a
              statement's contents, and the editor starts from it once. */}
          {text === undefined ? (
            <LoadingLine />
          ) : (
            <Body
              ref={body}
              value={text}
              onChange={textSave.onChange}
              placeholder="Contenido"
              ariaLabel="Contenido"
            />
          )}

          <div>
            <SectionLabel>Adjuntos</SectionLabel>
            <AttachmentGrid
              owner={{ kind: 'note', id: note.id }}
              ownerPath={entryPath('notas', note.id)}
            />
          </div>

          <DeleteDialog
            open={deleting}
            question="¿Eliminar la nota?"
            onCancel={() => setDeleting(false)}
            onConfirm={() => void removeNote(note.id)}
          />
        </article>
      )}
    </EntryPage>
  );
}
