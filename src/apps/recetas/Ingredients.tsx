import { useState } from 'react';
// The only place an app reaches into another. Recetas is still a sketch;
// where pushing to the shopping list belongs is settled when it is built out.
import { useShoppingList } from '../compras/useShoppingList';
import Button from '../../components/Button';
import IngredientRow from './IngredientRow';

interface IngredientsProps {
  /** One ingredient per line. */
  items: string;
}

/** An `:::ingredients` block: a tickable list with a way to push what's missing
 *  to the shopping list. Ticks are a reading aid for one cooking session —
 *  they live in this instance only and are never saved. */
export default function Ingredients({ items }: IngredientsProps) {
  const names = items ? items.split('\n') : [];
  const { add } = useShoppingList();
  const [have, setHave] = useState<ReadonlySet<number>>(() => new Set());
  const [sent, setSent] = useState<ReadonlySet<number>>(() => new Set());

  if (names.length === 0) return null;

  const missing = names
    .map((_, index) => index)
    .filter((index) => !have.has(index) && !sent.has(index));

  function toggle(index: number) {
    setHave((current) => {
      const next = new Set(current);
      if (!next.delete(index)) next.add(index);
      return next;
    });
  }

  async function send(index: number) {
    await add(names[index]);
    setSent((current) => new Set(current).add(index));
  }

  async function sendMissing() {
    // One at a time so each lands after the previous on the shopping list.
    for (const index of missing) await send(index);
  }

  return (
    <section className="my-4 border border-border bg-surface-raised">
      <header className="flex items-baseline justify-between gap-2 px-3 pt-3 pb-1">
        <p className="font-semibold">Ingredientes</p>
        <p className="text-xs text-muted">marcá lo que ya tenés</p>
      </header>
      <ul className="divide-y divide-border">
        {names.map((name, index) => (
          <IngredientRow
            key={index}
            label={name}
            have={have.has(index)}
            sent={sent.has(index)}
            onToggle={() => toggle(index)}
            onSend={() => void send(index)}
          />
        ))}
      </ul>
      <footer className="flex justify-end border-t border-border px-3 py-2">
        <Button size="sm" onClick={() => void sendMissing()} disabled={missing.length === 0}>
          Faltan → Compras ({missing.length})
        </Button>
      </footer>
    </section>
  );
}
