import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import AddBar from '../../components/AddBar';
import EmptyState from '../../components/EmptyState';
import EntryMarks from '../../components/EntryMarks';
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import SectionLabel from '../../components/SectionLabel';
import SkeletonRows from '../../components/SkeletonRows';
import { entryPath } from '../types';
import { NO_GROUP, groupIdeas, lastEditedGroup } from './grouping';
import { ideaMarks } from './marks';
import { useIdeas } from './useIdeas';

export default function IdeasPage() {
  const { items, loading, error, add } = useIdeas();
  const { items: attachments } = useAttachments();
  const attached = useMemo(() => ownersWithAttachments(attachments, 'idea'), [attachments]);
  const navigate = useNavigate();

  const groups = useMemo(() => groupIdeas(items), [items]);

  /** An idea is born from its title alone, in the group of the idea last
   *  written on, and opened to be written on. */
  async function addIdea(title: string) {
    const id = await add({ title, group_name: lastEditedGroup(items), body: '' });
    if (id) navigate(entryPath('ideas', id));
  }

  return (
    <ListPage
      loading={loading}
      error={error}
      skeleton={<SkeletonRows />}
      bar={
        <AddBar
          onAdd={(title) => void addIdea(title)}
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
            {group.name !== NO_GROUP && <SectionLabel>{group.name}</SectionLabel>}
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
