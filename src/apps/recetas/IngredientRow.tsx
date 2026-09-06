import { IconCheck, IconShoppingCartPlus } from '@tabler/icons-react';
import CheckSquare from '../../components/CheckSquare';
import IconButton from '../../components/IconButton';

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
        <CheckSquare checked={have} />
        <span
          className={`min-w-0 flex-1 break-words ${have ? 'text-muted line-through' : 'text-on-surface'}`}
        >
          {label}
        </span>
      </button>
      <IconButton
        label={sendLabel}
        icon={sent ? IconCheck : IconShoppingCartPlus}
        size={18}
        onClick={onSend}
        disabled={sent}
        className="px-3"
      />
    </li>
  );
}
