import { useNavigate } from 'react-router-dom';
import EntryPage from '../../components/EntryPage';
import LoadingLine from '../../components/LoadingLine';
import { useEntry } from '../../hooks/useEntry';
import { useMasterKey } from '../../hooks/useMasterKey';
import { appPath, entryPath } from '../types';
import NoteForm from './NoteForm';
import { useNoteText } from './useNoteText';
import { useNotes, type NoteInput } from './useNotes';

export default function NoteEditPage() {
  const { items, loading, error, save, remove } = useNotes();
  const note = useEntry(items);
  const { text, error: bodyError } = useNoteText(note);
  const masterKey = useMasterKey();
  const navigate = useNavigate();

  return (
    <EntryPage
      entry={note}
      loading={loading}
      error={error ?? bodyError}
      missing="Nota no encontrada."
    >
      {(note) =>
        // The form can only start once the note is open: it is what it edits.
        text === undefined ? (
          <LoadingLine />
        ) : (
          <NoteForm
            key={note.id}
            note={note}
            text={text}
            onSave={async (input: NoteInput) => {
              if (masterKey.status !== 'unlocked') return;
              await save(note.id, input, masterKey.key);
              navigate(entryPath('notas', note.id));
            }}
            onRemove={async () => {
              await remove(note.id);
              navigate(appPath('notas'));
            }}
          />
        )
      }
    </EntryPage>
  );
}
