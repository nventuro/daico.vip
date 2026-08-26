import { IconCheck, IconShoppingCartPlus } from '@tabler/icons-react';

interface IngredientRowProps {
  label: string;
  /** Ticked: the reader already has this one. */
  have: boolean;
  /** Already pushed to the shopping list. */
  sent: boolean;
  onToggle: () => void;
  onSend: () => void;
}

/** One ingredient: the row ticks it off, the trailing button sends it to the
 *  shopping list (once). */
export default function IngredientRow({ label, have, sent, onToggle, onSend }: IngredientRowProps) {
  const toggleLabel = have ? 'No lo tengo' : 'Ya lo tengo';
  const sendLabel = sent ? 'En Compras' : 'Agregar a Compras';

  return (
    <li className="flex items-stretch">
      <button
        type="button"
        onClick={onToggle}
        aria-label={toggleLabel}
        title={toggleLabel}
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            have ? 'border-primary bg-primary text-on-primary' : 'border-neutral-hover text-transparent'
          }`}
        >
          <IconCheck size={14} stroke={3} />
        </span>
        <span className={`min-w-0 flex-1 break-words ${have ? 'text-muted line-through' : 'text-on-surface'}`}>
          {label}
        </span>
      </button>
      <button
        type="button"
        onClick={onSend}
        disabled={sent}
        aria-label={sendLabel}
        title={sendLabel}
        className="flex shrink-0 items-center px-3 text-muted transition-colors hover:text-primary disabled:hover:text-muted"
      >
        {sent ? <IconCheck size={18} stroke={1.5} /> : <IconShoppingCartPlus size={18} stroke={1.5} />}
      </button>
    </li>
  );
}
