import { useState } from 'react';
import type { Recipe } from '../../lib/offline/specs';
import FormField from '../../components/FormField';
import TextInput from '../../components/TextInput';
import TextArea from '../../components/TextArea';
import TitleField from '../../components/TitleField';
import { CONTROL_CLASS } from '../../components/controlClasses';
import Button from '../../components/Button';
import FormFooter from '../../components/FormFooter';
import { entryForm } from '../../utils/formUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
import type { RecipeInput } from './useRecipes';

/** Smallest value accepted for a recipe's minutes or servings (input guard). */
const RECIPE_QUANTITY_MIN = 1;

interface RecipeFormProps {
  recipe: Recipe;
  onSave: (input: RecipeInput) => void;
  onRemove: () => void;
}

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

  const input: RecipeInput = {
    title: lowercaseTrimmed(title),
    body,
    minutes: parseQuantity(minutes),
    servings: parseQuantity(servings),
  };
  const { canSave, onSubmit } = entryForm(input, recipe, onSave, input.title !== '');

  function insertIngredients() {
    setBody((current) =>
      current.trim() ? `${current.trimEnd()}\n\n${INGREDIENTS_SNIPPET}` : INGREDIENTS_SNIPPET,
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TitleField value={title} onChange={setTitle} />

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Minutos">
          <TextInput
            type="number"
            inputMode="numeric"
            min={RECIPE_QUANTITY_MIN}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            aria-label="Minutos"
          />
        </FormField>
        <FormField label="Porciones">
          <TextInput
            type="number"
            inputMode="numeric"
            min={RECIPE_QUANTITY_MIN}
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            aria-label="Porciones"
          />
        </FormField>
      </div>

      <FormField label="Receta (Markdown)">
        <TextArea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="Receta (Markdown)"
          rows={14}
          className={`${CONTROL_CLASS} font-mono`}
        />
      </FormField>

      <div>
        <Button variant="outline" size="sm" onClick={insertIngredients}>
          Insertar ingredientes
        </Button>
      </div>

      <FormFooter
        removeLabel="Eliminar receta"
        confirmQuestion="¿Eliminar la receta?"
        onRemove={onRemove}
        submitDisabled={!canSave}
      />
    </form>
  );
}
