import { IconArchive, IconArchiveOff } from '@tabler/icons-react';
import { StaticChip } from '../../components/Chip';
import EntryHead from '../../components/EntryHead';
import EntryPage from '../../components/EntryPage';
import GroupField from '../../components/GroupField';
import IconButton from '../../components/IconButton';
import LinkRow from '../../components/LinkRow';
import SectionLabel from '../../components/SectionLabel';
import { useEntry } from '../../hooks/useEntry';
import { groupRuns } from '../../utils/listUtils';
import { entryPath } from '../types';
import { guideGroupNames } from './grouping';
import { useGuides } from './useGuides';

/** A guide: what the household decides about it — its title, the group it
 *  is shelved under, whether it is archived — written in place, and its
 *  chapters, which are only ever read. */
export default function GuidePage() {
  const { guides, chapters, loading, error, save } = useGuides();
  const guide = useEntry(guides, 'guideId');

  return (
    <EntryPage entry={guide} loading={loading} error={error} missing="Guía no encontrada.">
      {(guide) => {
        // Sections are runs of chapters, in the store's reading order.
        const sections = groupRuns(
          chapters.filter((c) => c.guide_id === guide.id),
          (chapter) => chapter.section_title,
        );
        return (
          <div className="flex flex-col gap-5">
            {/* A guide keeps its capitals — it is named after a document, not
                typed in the lower case the household's lists are kept in —
                and so does its group. No trash: a guide is only ever removed
                by the import. */}
            <EntryHead
              key={guide.id}
              title={guide.title}
              onTitle={(title) => void save(guide.id, { title })}
              autoCapitalize="sentences"
              subtitle={
                guide.description ? (
                  <span className="text-sm whitespace-pre-line">{guide.description}</span>
                ) : undefined
              }
              chips={
                <>
                  <GroupField
                    groups={guideGroupNames(guides)}
                    value={guide.group_name}
                    onChange={(group) => void save(guide.id, { group_name: group.trim() })}
                  />
                  {guide.archived && (
                    <StaticChip>
                      <IconArchive size={16} stroke={1.5} />
                      Archivada
                    </StaticChip>
                  )}
                </>
              }
              actions={
                // Archiving destroys nothing and the same control brings the
                // guide back, so it takes one tap and no question.
                <IconButton
                  label={guide.archived ? 'Desarchivar guía' : 'Archivar guía'}
                  icon={guide.archived ? IconArchiveOff : IconArchive}
                  onClick={() => void save(guide.id, { archived: !guide.archived })}
                />
              }
            />
            {sections.map((section) => (
              <section key={section.key}>
                <SectionLabel>{section.key}</SectionLabel>
                {/* Chapters are read in order, so the list says so. */}
                <ol>
                  {section.items.map((chapter) => (
                    <LinkRow
                      key={chapter.id}
                      to={entryPath('guias', guide.id, chapter.id)}
                      title={chapter.title}
                    />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        );
      }}
    </EntryPage>
  );
}
