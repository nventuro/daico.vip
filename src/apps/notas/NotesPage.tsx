import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import { draftTitleState } from '../../hooks/useDraftTitle';
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
  const { items, loading, error } = useNotes();
  const { items: attachments } = useAttachments();
  const attached = useMemo(() => ownersWithAttachments(attachments, 'note'), [attachments]);
  const navigate = useNavigate();

  const groups = useMemo(() => groupNotes(items, todayIso()), [items]);

  return (
    <ListPage
      loading={loading}
      error={error}
      skeleton={<SkeletonRows />}
      bar={
        <AddBar
          // The note is written on save: the title goes on to the form, and
          // nothing is written until it is saved there.
          onAdd={(title) =>
            navigate(entryPath('notas', 'nuevo'), { state: draftTitleState(title) })
          }
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
