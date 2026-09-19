import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import AddBar from '../../components/AddBar';
import CompletedSection from '../../components/CompletedSection';
import EmptyState from '../../components/EmptyState';
import EntryMarks from '../../components/EntryMarks';
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import SectionLabel from '../../components/SectionLabel';
import SkeletonRows from '../../components/SkeletonRows';
import { entryPath } from '../types';
import { NO_GROUP, groupIdeas, lastEditedGroup, type IdeaGroup } from './grouping';
import { ideaMarks } from './marks';
import { useIdeas } from './useIdeas';

export default function IdeasPage() {
  const { items, loading, error, add } = useIdeas();
  const { items: attachments } = useAttachments();
  const attached = useMemo(() => ownersWithAttachments(attachments, 'idea'), [attachments]);
  const navigate = useNavigate();

  const listed = useMemo(() => items.filter((idea) => !idea.archived), [items]);
  const archived = useMemo(() => items.filter((idea) => idea.archived), [items]);
  const groups = useMemo(() => groupIdeas(listed), [listed]);
  const archivedGroups = useMemo(() => groupIdeas(archived), [archived]);

  /** An idea is born from its title alone, in the group of the idea last
   *  written on, and opened to be written on. Archiving is a write too, so
   *  only the ideas on the list count: the one just put away would otherwise
   *  pull the next idea into its group. */
  async function addIdea(title: string) {
    const id = await add({ title, group_name: lastEditedGroup(listed), body: '' });
    if (id) void navigate(entryPath('ideas', id));
  }

  /** The groups as sections, the first flush with what is above it and the
   *  rest 24px apart. */
  function renderGroups(shown: IdeaGroup[]) {
    return shown.map((group, i) => (
      <section key={group.name} className={i > 0 ? 'mt-6' : undefined}>
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
    ));
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
      {items.length === 0 ? (
        <EmptyState>Todavía no hay ideas.</EmptyState>
      ) : (
        <>
          {renderGroups(groups)}
          {/* Out of the way, but filed the same: a group whose ideas were all
              archived still reads as a group. */}
          <CompletedSection label="Archivadas" count={archived.length}>
            {renderGroups(archivedGroups)}
          </CompletedSection>
        </>
      )}
    </ListPage>
  );
}
