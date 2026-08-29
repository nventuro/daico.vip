import EntryPage from '../../components/EntryPage';
import Heading from '../../components/Heading';
import LinkRow from '../../components/LinkRow';
import SectionLabel from '../../components/SectionLabel';
import { useEntry } from '../../hooks/useEntry';
import { groupRuns } from '../../utils/listUtils';
import { entryPath } from '../types';
import { useGuides } from './useGuides';

export default function GuidePage() {
  const { guides, chapters, loading, error } = useGuides();
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
            <div>
              <Heading>{guide.title}</Heading>
              {guide.description && (
                <p className="mt-1 text-sm whitespace-pre-line text-muted">{guide.description}</p>
              )}
            </div>
            {sections.map((section) => (
              <section key={section.key}>
                <SectionLabel>{section.key}</SectionLabel>
                {/* Chapters are read in order, so the list says so. */}
                <ol>
                  {section.items.map((chapter) => (
                    <LinkRow
                      key={chapter.id}
                      to={`${entryPath('guias', guide.id)}/${chapter.id}`}
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
