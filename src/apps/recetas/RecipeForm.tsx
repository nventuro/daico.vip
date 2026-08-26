import { type FormEvent, useState } from 'react';
import { RECIPE_QUANTITY_MIN, type Recipe } from '../../types';
import type { RecipeInput } from './useRecipes';

interface RecipeFormProps {
  recipe: Recipe;
  onSave: (input: RecipeInput) => void;
  onRemove: () => void;
}

const FIELD = 'flex flex-col gap-1 text-sm text-muted';
const CONTROL =
  'rounded-xl border border-border bg-surface-raised px-3 py-2 text-base text-on-surface outline-none transition-colors focus:border-primary';

/** An empty ingredients block, ready for the first item. */
const INGREDIENTS_SNIPPET = ':::ingredients\n- \n:::\n';

/** A quantity field's value: empty (or anything below the minimum) means unset. */
function parseQuantity(raw: string): number | null {
  const value = Number.parseInt(raw, 10);
  return Number.isInteger(value) && value >= RECIPE_QUANTITY_MIN ? value : null;
}

/** Edits every field of one recipe. Keyed by the recipe's id by its caller, so
 *  the local draft starts from the recipe once and never chases it afterwards. */
export default function RecipeForm({ recipe, onSave, onRemove }: RecipeFormProps) {
  const [title, setTitle] = useState(recipe.title);
  const [minutes, setMinutes] = useState(recipe.minutes?.toString() ?? '');
  const [servings, setServings] = useState(recipe.servings?.toString() ?? '');
  const [body, setBody] = useState(recipe.body);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    onSave({ title: value, body, minutes: parseQuantity(minutes), servings: parseQuantity(servings) });
  }

  function insertIngredients() {
    setBody((current) => (current.trim() ? `${current.trimEnd()}\n\n${INGREDIENTS_SNIPPET}` : INGREDIENTS_SNIPPET));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={FIELD}>
        <span>Título</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Título"
          autoCapitalize="sentences"
          required
          className={CONTROL}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className={FIELD}>
          <span>Minutos</span>
          <input
            type="number"
            inputMode="numeric"
            min={RECIPE_QUANTITY_MIN}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            aria-label="Minutos"
            className={CONTROL}
          />
        </label>
        <label className={FIELD}>
          <span>Porciones</span>
          <input
            type="number"
            inputMode="numeric"
            min={RECIPE_QUANTITY_MIN}
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            aria-label="Porciones"
            className={CONTROL}
          />
        </label>
      </div>

      <label className={FIELD}>
        <span>Receta (Markdown)</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="Receta (Markdown)"
          rows={14}
          className={`${CONTROL} font-mono`}
        />
      </label>

      <div>
        <button
          type="button"
          onClick={insertIngredients}
          className="rounded-full border border-border px-3 py-2 text-sm text-muted-strong transition-colors hover:bg-border-subtle"
        >
          Insertar ingredientes
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full px-3 py-2 text-sm text-error transition-colors hover:bg-border-subtle"
        >
          Eliminar receta
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-full bg-primary px-4 py-2 text-on-primary transition-colors hover:bg-primary-hover disabled:bg-disabled"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
