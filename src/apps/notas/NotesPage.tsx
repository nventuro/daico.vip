import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import { useMasterKey } from '../../hooks/useMasterKey';
import { todayIso } from '../../utils/dateUtils';
import AddBar from '../../components/AddBar';
import EmptyState from '../../components/EmptyState';
import EntryMarks from '../../components/EntryMarks';
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import SectionLabel from '../../components/SectionLabel';
import SkeletonRows from '../../components/SkeletonRows';
import { entryPath } from '../types';
import { groupNotes } from './grouping';
import { noteMarks } from './marks';
import { useNotes } from './useNotes';

export default function NotesPage() {
  const { items, loading, error, add } = useNotes();
  const { items: attachments } = useAttachments();
  const attached = useMemo(() => ownersWithAttachments(attachments, 'note'), [attachments]);
  const masterKey = useMasterKey();
  const navigate = useNavigate();

  const groups = useMemo(() => groupNotes(items, todayIso()), [items]);

  async function addNote(title: string) {
    if (masterKey.status !== 'unlocked') return;
    const id = await add(title, masterKey.key);
    // A new note is just a title: go straight to writing it.
    if (id) navigate(entryPath('notas', id, 'editar'));
  }

  return (
    <ListPage
      loading={loading}
      error={error}
      skeleton={<SkeletonRows />}
      bar={
        <AddBar
          onAdd={(title) => void addNote(title)}
          placeholder="Agregar una nota..."
          inputLabel="Nueva nota"
        />
      }
    >
      {groups.length === 0 ? (
        <EmptyState>Todavía no hay notas.</EmptyState>
      ) : (
        groups.map((group, i) => (
          <section key={group.key} className={i > 0 ? 'mt-6' : undefined}>
            <SectionLabel>{group.label}</SectionLabel>
            <ul>
              {group.notes.map((note) => (
                <LinkRow
                  key={note.id}
                  to={entryPath('notas', note.id)}
                  title={note.title}
                  trailing={<EntryMarks marks={noteMarks(attached.has(note.id))} />}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </ListPage>
  );
}
