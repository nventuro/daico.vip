import { IconPencil } from '@tabler/icons-react';
import AttachmentGrid from '../../components/AttachmentGrid';
import EntryPage from '../../components/EntryPage';
import Heading from '../../components/Heading';
import IconButton from '../../components/IconButton';
import LoadingLine from '../../components/LoadingLine';
import Markdown from '../../components/markdown/Markdown';
import SectionLabel from '../../components/SectionLabel';
import { useEntry } from '../../hooks/useEntry';
import { relativeDayTime, todayIso } from '../../utils/dateUtils';
import { entryPath } from '../types';
import { useNoteText } from './useNoteText';
import { useNotes } from './useNotes';

export default function NotePage() {
  const { items, loading, error } = useNotes();
  const note = useEntry(items);
  const { text, error: bodyError } = useNoteText(note);

  return (
    <EntryPage
      entry={note}
      loading={loading}
      error={error ?? bodyError}
      missing="Nota no encontrada."
    >
      {(note) => (
        <article className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <Heading>{note.title}</Heading>
              <span className="text-xs text-muted">
                Editada {relativeDayTime(todayIso(), note.updated_at)}
              </span>
            </div>
            <IconButton
              label="Editar nota"
              icon={IconPencil}
              to={entryPath('notas', note.id, 'editar')}
            />
          </div>

          {/* Reading a note is opening it: the body is sealed like a
              statement's contents. */}
          {text === undefined ? (
            <LoadingLine />
          ) : text.trim() ? (
            <div className="text-on-surface">
              <Markdown body={text} />
            </div>
          ) : (
            <p className="text-muted">Todavía no escribiste la nota.</p>
          )}

          <div>
            <SectionLabel>Adjuntos</SectionLabel>
            <AttachmentGrid
              owner={{ kind: 'note', id: note.id }}
              ownerPath={entryPath('notas', note.id)}
            />
          </div>
        </article>
      )}
    </EntryPage>
  );
}
