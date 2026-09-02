import { IconArchive, IconArchiveOff, IconPencil } from '@tabler/icons-react';
import { StaticChip } from '../../components/Chip';
import EntryPage from '../../components/EntryPage';
import Heading from '../../components/Heading';
import IconButton from '../../components/IconButton';
import LinkRow from '../../components/LinkRow';
import SectionLabel from '../../components/SectionLabel';
import { useEntry } from '../../hooks/useEntry';
import { groupRuns } from '../../utils/listUtils';
import { entryPath } from '../types';
import { useGuides } from './useGuides';

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
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Heading>{guide.title}</Heading>
                {guide.description && (
                  <p className="mt-1 text-sm whitespace-pre-line text-muted">{guide.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <IconButton
                  label="Editar guía"
                  icon={IconPencil}
                  to={entryPath('guias', guide.id, 'editar')}
                />
                {/* Archiving destroys nothing and the same control brings the
                    guide back, so it takes one tap and no question. */}
                <IconButton
                  label={guide.archived ? 'Desarchivar guía' : 'Archivar guía'}
                  icon={guide.archived ? IconArchiveOff : IconArchive}
                  onClick={() => void save(guide.id, { archived: !guide.archived })}
                />
              </div>
            </div>
            {guide.archived && (
              <div className="flex flex-wrap gap-2">
                <StaticChip>
                  <IconArchive size={16} stroke={1.5} />
                  Archivada
                </StaticChip>
              </div>
            )}
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
