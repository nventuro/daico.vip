import { Link, useParams } from 'react-router-dom';
import type { GuideChapter } from '../../types';
import { useGuides } from './useGuides';

/** Chapters grouped by section, preserving the store's reading order. */
function groupBySection(chapters: GuideChapter[]): { title: string; chapters: GuideChapter[] }[] {
  const sections: { title: string; chapters: GuideChapter[] }[] = [];
  for (const chapter of chapters) {
    const last = sections.at(-1);
    if (last && last.title === chapter.section_title) last.chapters.push(chapter);
    else sections.push({ title: chapter.section_title, chapters: [chapter] });
  }
  return sections;
}

export default function GuidePage() {
  const { guideId } = useParams();
  const { guides, chapters, loading } = useGuides();
  const guide = guides.find((g) => g.id === guideId);

  if (loading) return <p className="text-muted">Cargando...</p>;
  if (!guide) return <p className="text-muted">Guía no encontrada.</p>;

  const sections = groupBySection(chapters.filter((c) => c.guide_id === guide.id));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold">{guide.title}</h1>
        {guide.description && <p className="mt-1 text-sm whitespace-pre-line text-muted">{guide.description}</p>}
      </div>
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{section.title}</h2>
          <ol className="divide-y divide-border rounded-xl border border-border bg-surface-raised">
            {section.chapters.map((chapter) => (
              <li key={chapter.id}>
                <Link to={`/guias/${guide.id}/${chapter.id}`} className="block px-4 py-3 hover:bg-border-subtle">
                  {chapter.title}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
