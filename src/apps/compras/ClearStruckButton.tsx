import type { ShoppingItem } from '../../lib/offline/specs';
import { offerUndo } from '../../lib/undo';
import Button from '../../components/Button';

interface ClearStruckButtonProps {
  /** Deletes the struck items in view; resolves to what was deleted. */
  clear: () => Promise<ShoppingItem[] | undefined>;
  /** Puts deleted items back. */
  restore: (removed: ShoppingItem[]) => Promise<unknown>;
}

/** «Borrar tachados» over the bar: what was struck goes at once, with an
 *  undo. */
export default function ClearStruckButton({ clear, restore }: ClearStruckButtonProps) {
  async function clearStruck() {
    const removed = await clear();
    if (removed?.length) {
      offerUndo({ message: 'Tachados borrados', undo: () => restore(removed) });
    }
  }

  return (
    <Button variant="dangerOutline" size="sm" onClick={() => void clearStruck()}>
      Borrar tachados
    </Button>
  );
}
