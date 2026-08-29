import { IconClock, IconPencil, IconUsers } from '@tabler/icons-react';
import { StaticChip } from '../../components/Chip';
import EntryPage from '../../components/EntryPage';
import Heading from '../../components/Heading';
import IconButton from '../../components/IconButton';
import { useEntry } from '../../hooks/useEntry';
import { entryPath } from '../types';
import RecipeMarkdown from './RecipeMarkdown';
import { useRecipes } from './useRecipes';
import { minutesLabel, servingsLabel } from './labels';

export default function RecipePage() {
  const { items, loading, error } = useRecipes();
  const recipe = useEntry(items);

  return (
    <EntryPage entry={recipe} loading={loading} error={error} missing="Receta no encontrada.">
      {(recipe) => (
        <article className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <Heading>{recipe.title}</Heading>
            <IconButton
              label="Editar receta"
              icon={IconPencil}
              to={`${entryPath('recetas', recipe.id)}/editar`}
            />
          </div>

          {(recipe.minutes != null || recipe.servings != null) && (
            <div className="flex flex-wrap gap-2">
              {recipe.minutes != null && (
                <StaticChip>
                  <IconClock size={16} stroke={1.5} />
                  {minutesLabel(recipe.minutes)}
                </StaticChip>
              )}
              {recipe.servings != null && (
                <StaticChip>
                  <IconUsers size={16} stroke={1.5} />
                  {servingsLabel(recipe.servings)}
                </StaticChip>
              )}
            </div>
          )}

          {recipe.body.trim() ? (
            <div className="text-on-surface">
              <RecipeMarkdown body={recipe.body} />
            </div>
          ) : (
            <p className="text-muted">Todavía no escribiste la receta.</p>
          )}
        </article>
      )}
    </EntryPage>
  );
}
