import { useLeave } from '../../hooks/useLeave';
import { useEntry } from '../../hooks/useEntry';
import EntryPage from '../../components/EntryPage';
import { appPath, entryPath } from '../types';
import { useRecipes, type RecipeInput } from './useRecipes';
import RecipeForm from './RecipeForm';

export default function RecipeEditPage() {
  const { items, loading, error, save, remove } = useRecipes();
  const recipe = useEntry(items);
  const leave = useLeave();

  return (
    <EntryPage entry={recipe} loading={loading} error={error} missing="Receta no encontrada.">
      {(recipe) => (
        <RecipeForm
          key={recipe.id}
          recipe={recipe}
          onSave={async (input: RecipeInput) => {
            await save(recipe.id, input);
            leave(entryPath('recetas', recipe.id));
          }}
          onRemove={async () => {
            await remove(recipe.id);
            leave(appPath('recetas'));
          }}
        />
      )}
    </EntryPage>
  );
}
