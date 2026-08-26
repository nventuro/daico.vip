import { Link, useParams } from 'react-router-dom';
import { IconClock, IconPencil, IconUsers } from '@tabler/icons-react';
import Markdown from '../../components/Markdown';
import { useRecipes } from './useRecipes';
import { minutesLabel, servingsLabel } from './labels';

const CHIP =
  'inline-flex items-center gap-1 rounded-full border border-border bg-surface-raised px-3 py-1 text-sm text-muted';

export default function RecipePage() {
  const { id } = useParams();
  const { items, loading, error } = useRecipes();

  const recipe = items.find((r) => r.id === id);

  if (loading) return <p className="text-muted">Cargando...</p>;
  if (!recipe) return <p className="text-muted">Receta no encontrada.</p>;

  return (
    <article className="flex flex-col gap-4">
      {error && <p className="text-sm text-error">Error: {error}</p>}

      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{recipe.title}</h1>
        <Link
          to={`/recetas/${recipe.id}/editar`}
          aria-label="Editar receta"
          title="Editar receta"
          className="shrink-0 rounded-full p-2 text-muted transition-colors hover:bg-border-subtle hover:text-on-surface"
        >
          <IconPencil size={20} stroke={1.5} />
        </Link>
      </div>

      {(recipe.minutes != null || recipe.servings != null) && (
        <div className="flex flex-wrap gap-2">
          {recipe.minutes != null && (
            <span className={CHIP}>
              <IconClock size={16} stroke={1.5} />
              {minutesLabel(recipe.minutes)}
            </span>
          )}
          {recipe.servings != null && (
            <span className={CHIP}>
              <IconUsers size={16} stroke={1.5} />
              {servingsLabel(recipe.servings)}
            </span>
          )}
        </div>
      )}

      {recipe.body.trim() ? (
        <div className="text-on-surface">
          <Markdown body={recipe.body} />
        </div>
      ) : (
        <p className="text-muted">Todavía no escribiste la receta.</p>
      )}
    </article>
  );
}
