import { Link } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';
import { useGuides } from './useGuides';

export default function GuidesPage() {
  const { guides, loading, error } = useGuides();

  if (loading) return <p className="text-muted">Cargando...</p>;

  return (
    <div className="flex flex-col">
      {error && <p className="text-sm text-error">{error}</p>}
      {guides.length === 0 && <p className="text-muted">Todavía no hay guías.</p>}
      {guides.map((guide) => (
        <Link
          key={guide.id}
          to={`/guias/${guide.id}`}
          className="flex items-center justify-between gap-3 border-b border-border py-3.5 transition-colors hover:bg-border-subtle"
        >
          <span className="min-w-0 font-medium">{guide.title}</span>
          <IconChevronRight size={18} stroke={1.5} className="shrink-0 text-muted" />
        </Link>
      ))}
    </div>
  );
}
