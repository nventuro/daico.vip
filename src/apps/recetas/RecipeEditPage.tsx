import { useNavigate, useParams } from 'react-router-dom';
import type { RecipeInput } from './useRecipes';
import { useRecipes } from './useRecipes';
import RecipeForm from './RecipeForm';

export default function RecipeEditPage() {
  const { id } = useParams();
  const { items, loading, error, save, remove } = useRecipes();
  const navigate = useNavigate();

  const recipe = items.find((r) => r.id === id);

  if (loading) return <p className="text-muted">Cargando...</p>;
  if (!recipe) return <p className="text-muted">Receta no encontrada.</p>;

  const handleSave = async (input: RecipeInput) => {
    await save(recipe.id, input);
    navigate(`/recetas/${recipe.id}`);
  };

  const handleRemove = async () => {
    await remove(recipe);
    navigate('/recetas');
  };

  return (
    <>
      {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}
      <RecipeForm key={recipe.id} recipe={recipe} onSave={handleSave} onRemove={handleRemove} />
    </>
  );
}
