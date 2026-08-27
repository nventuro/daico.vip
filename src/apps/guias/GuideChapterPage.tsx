import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useGuides } from './useGuides';
import GuideMarkdown from './GuideMarkdown';

export default function GuideChapterPage() {
  const { guideId, chapterId } = useParams();
  const { guides, chapters, loading } = useGuides();
  const guide = guides.find((g) => g.id === guideId);
  const guideChapters = chapters.filter((c) => c.guide_id === guideId);
  const index = guideChapters.findIndex((c) => c.id === chapterId);
  const chapter = index === -1 ? undefined : guideChapters[index];
  const previous = index > 0 ? guideChapters[index - 1] : undefined;
  const next =
    index !== -1 && index < guideChapters.length - 1 ? guideChapters[index + 1] : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterId]);

  if (loading) return <p className="text-muted">Cargando...</p>;
  if (!guide || !chapter) return <p className="text-muted">Capítulo no encontrado.</p>;

  const navLink = 'inline-flex max-w-[48%] items-center gap-1 text-sm text-primary hover:underline';

  return (
    <article className="flex flex-col gap-4">
      <p className="text-sm text-muted">{guide.title}</p>
      <h1 className="font-display text-3xl font-bold">{chapter.title}</h1>
      <div className="text-on-surface">
        <GuideMarkdown body={chapter.body} />
      </div>
      <nav className="mt-6 flex justify-between gap-4 border-t border-border pt-4">
        {previous ? (
          <Link to={`/guias/${guide.id}/${previous.id}`} className={navLink}>
            <IconChevronLeft size={16} stroke={1.5} className="shrink-0" />
            <span className="truncate">{previous.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/guias/${guide.id}/${next.id}`} className={`${navLink} text-right`}>
            <span className="truncate">{next.title}</span>
            <IconChevronRight size={16} stroke={1.5} className="shrink-0" />
          </Link>
        )}
      </nav>
    </article>
  );
}
