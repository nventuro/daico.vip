import { useState } from 'react';
import { IconClock, IconPencil, IconTrash, IconUsers } from '@tabler/icons-react';
import { StaticChip } from '../../components/Chip';
import DeleteDialog from '../../components/DeleteDialog';
import EntryPage from '../../components/EntryPage';
import Heading from '../../components/Heading';
import IconButton from '../../components/IconButton';
import { useEntry } from '../../hooks/useEntry';
import { useLeave } from '../../hooks/useLeave';
import { appPath, entryPath } from '../types';
import RecipeMarkdown from './RecipeMarkdown';
import { useRecipes } from './useRecipes';
import { minutesLabel, servingsLabel } from './labels';

export default function RecipePage() {
  const { items, loading, error, remove } = useRecipes();
  const recipe = useEntry(items);
  const leave = useLeave();
  const [deleting, setDeleting] = useState(false);

  async function removeRecipe(id: string) {
    await remove(id);
    leave(appPath('recetas'));
  }

  return (
    <EntryPage entry={recipe} loading={loading} error={error} missing="Receta no encontrada.">
      {(recipe) => (
        <article className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <Heading>{recipe.title}</Heading>
            {/* The recipe is still written on a form of its own, until the
                editor has an ingredients block; its delete is here, like
                every entry's. */}
            <div className="flex shrink-0 items-center gap-1">
              <IconButton
                label="Editar receta"
                icon={IconPencil}
                to={entryPath('recetas', recipe.id, 'editar')}
              />
              <IconButton
                label="Eliminar receta"
                icon={IconTrash}
                onClick={() => setDeleting(true)}
              />
            </div>
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

          <DeleteDialog
            open={deleting}
            question="¿Eliminar la receta?"
            onCancel={() => setDeleting(false)}
            onConfirm={() => void removeRecipe(recipe.id)}
          />
        </article>
      )}
    </EntryPage>
  );
}
