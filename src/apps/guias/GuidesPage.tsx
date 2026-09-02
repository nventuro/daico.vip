import { useMemo } from 'react';
import CompletedSection from '../../components/CompletedSection';
import EmptyState from '../../components/EmptyState';
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import SectionLabel from '../../components/SectionLabel';
import { entryPath } from '../types';
import { groupGuides, type GuideGroup } from './grouping';
import { useGuides } from './useGuides';

/** The groups as sections, the first flush with what is above it and the
 *  rest 24px apart. */
function renderGroups(groups: GuideGroup[]) {
  return groups.map((group, i) => (
    <section key={group.name} className={i > 0 ? 'mt-6' : undefined}>
      <SectionLabel>{group.name}</SectionLabel>
      <ul>
        {group.guides.map((guide) => (
          <LinkRow key={guide.id} to={entryPath('guias', guide.id)} title={guide.title} chevron />
        ))}
      </ul>
    </section>
  ));
}

export default function GuidesPage() {
  const { guides, loading, error } = useGuides();
  const shelved = useMemo(() => groupGuides(guides.filter((guide) => !guide.archived)), [guides]);
  const archived = useMemo(() => guides.filter((guide) => guide.archived), [guides]);
  const archivedGroups = useMemo(() => groupGuides(archived), [archived]);

  return (
    <ListPage loading={loading} error={error}>
      {guides.length === 0 ? (
        <EmptyState>Todavía no hay guías.</EmptyState>
      ) : (
        <>
          {renderGroups(shelved)}
          {/* Out of the way, but shelved the same: a group archived whole
              still reads as a group. */}
          <CompletedSection label="Archivadas" count={archived.length}>
            {renderGroups(archivedGroups)}
          </CompletedSection>
        </>
      )}
    </ListPage>
  );
}
