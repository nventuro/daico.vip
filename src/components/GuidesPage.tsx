import { Link } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';
import { useGuides } from '../hooks/useGuides';

export default function GuidesPage() {
  const { guides, loading, error } = useGuides();

  if (loading) return <p className="text-muted">Cargando...</p>;

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-error">{error}</p>}
      {guides.length === 0 && <p className="text-muted">Todavía no hay guías.</p>}
      {guides.map((guide) => (
        <Link
          key={guide.id}
          to={`/guias/${guide.id}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3 transition-colors hover:bg-border-subtle"
        >
          <span className="min-w-0 font-semibold">{guide.title}</span>
          <IconChevronRight size={18} stroke={1.5} className="shrink-0 text-muted" />
        </Link>
      ))}
    </div>
  );
}
