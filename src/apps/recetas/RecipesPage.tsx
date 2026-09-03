import { useNavigate } from 'react-router-dom';
import type { Recipe } from '../../lib/offline/specs';
import AddBar from '../../components/AddBar';
import EmptyState from '../../components/EmptyState';
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import SkeletonRows from '../../components/SkeletonRows';
import { entryPath } from '../types';
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

  // The one app still born from the bar and edited on a form: a recipe is
  // written in a textarea until the editor has an ingredients block of its
  // own, so a new one is just a title that goes straight to writing.
  async function addRecipe(title: string) {
    const id = await add(title);
    if (id) navigate(entryPath('recetas', id, 'editar'));
  }

  return (
    <ListPage
      loading={loading}
      error={error}
      skeleton={<SkeletonRows subtitle />}
      bar={
        <AddBar
          onAdd={(title) => void addRecipe(title)}
          placeholder="Agregar una receta..."
          inputLabel="Nueva receta"
        />
      }
    >
      {items.length === 0 ? (
        <EmptyState>Todavía no hay recetas.</EmptyState>
      ) : (
        <ul>
          {items.map((recipe) => (
            <LinkRow
              key={recipe.id}
              to={entryPath('recetas', recipe.id)}
              title={recipe.title}
              subtitle={metaLine(recipe) || undefined}
            />
          ))}
        </ul>
      )}
    </ListPage>
  );
}
