import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import { draftTitleState } from '../../hooks/useDraftTitle';
import AddBar from '../../components/AddBar';
import EmptyState from '../../components/EmptyState';
import EntryMarks from '../../components/EntryMarks';
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import SectionLabel from '../../components/SectionLabel';
import SkeletonRows from '../../components/SkeletonRows';
import { entryPath } from '../types';
import { groupIdeas } from './grouping';
import { ideaMarks } from './marks';
import { useIdeas } from './useIdeas';

export default function IdeasPage() {
  const { items, loading, error } = useIdeas();
  const { items: attachments } = useAttachments();
  const attached = useMemo(() => ownersWithAttachments(attachments, 'idea'), [attachments]);
  const navigate = useNavigate();

  const groups = useMemo(() => groupIdeas(items), [items]);

  return (
    <ListPage
      loading={loading}
      error={error}
      skeleton={<SkeletonRows />}
      bar={
        <AddBar
          // An idea is filed under a group before it exists: the title goes on
          // to the form, and nothing is written until it is saved there.
          onAdd={(title) =>
            navigate(entryPath('ideas', 'nuevo'), { state: draftTitleState(title) })
          }
          placeholder="Agregar una idea..."
          inputLabel="Nueva idea"
        />
      }
    >
      {groups.length === 0 ? (
        <EmptyState>Todavía no hay ideas.</EmptyState>
      ) : (
        groups.map((group) => (
          <section key={group.name} className="mb-6">
            <SectionLabel>{group.name}</SectionLabel>
            <ul>
              {group.ideas.map((idea) => (
                <LinkRow
                  key={idea.id}
                  to={entryPath('ideas', idea.id)}
                  title={idea.title}
                  trailing={<EntryMarks marks={ideaMarks(attached.has(idea.id))} />}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </ListPage>
  );
}
