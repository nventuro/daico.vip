import { useState } from 'react';
import { useShoppingList } from '../apps/compras/useShoppingList';
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

  const missing = names.map((_, index) => index).filter((index) => !have.has(index) && !sent.has(index));

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
    <section className="my-4 rounded-xl border border-border bg-surface-raised">
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
        <button
          type="button"
          onClick={() => void sendMissing()}
          disabled={missing.length === 0}
          className="rounded-full bg-primary px-4 py-2 text-sm text-on-primary transition-colors hover:bg-primary-hover disabled:bg-disabled"
        >
          Faltan → Compras ({missing.length})
        </button>
      </footer>
    </section>
  );
}
