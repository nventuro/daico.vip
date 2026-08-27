import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Recipe } from '../../types';
import OfflineBanner from '../../components/OfflineBanner';
import AddBar from '../../components/AddBar';
import { useRecipes } from './useRecipes';
import { minutesLabel, servingsLabel } from './labels';

/** "N min · N porciones", with only the parts that are set. */
function metaLine(recipe: Recipe): string {
  const parts: string[] = [];
  if (recipe.minutes != null) parts.push(minutesLabel(recipe.minutes));
  if (recipe.servings != null) parts.push(servingsLabel(recipe.servings));
  return parts.join(' · ');
}

export default function RecipesPage() {
  const { items, loading, error, add } = useRecipes();
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState('');

  async function addRecipe() {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle('');
    const id = await add(title);
    // A new recipe is just a title: go straight to writing it.
    if (id) navigate(`/recetas/${id}/editar`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        <OfflineBanner />

        {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}

        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-muted">Todavía no hay recetas.</p>
        ) : (
          <ul>
            {items.map((recipe) => {
              const meta = metaLine(recipe);
              return (
                <li key={recipe.id} className="border-b border-border">
                  <Link to={`/recetas/${recipe.id}`} className="flex flex-col py-2.5">
                    <span className="truncate text-on-surface">{recipe.title}</span>
                    {meta && <span className="mt-0.5 text-xs text-muted">{meta}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AddBar
        value={newTitle}
        onChange={setNewTitle}
        onSubmit={() => void addRecipe()}
        placeholder="Agregar una receta..."
        inputLabel="Nueva receta"
      />
    </div>
  );
}
