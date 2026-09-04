import { useEffect } from 'react';
import { useUndo } from '../hooks/useUndo';
import { UNDO_MS, endUndo, takeUndo, undoShown } from '../lib/undo';
import { ADD_BAR_CLASS } from './controlClasses';
import UndoBar from './UndoBar';

interface UndoNoticeProps {
  /** Whether this is the shell's copy, pinned at the bottom of a screen with
   *  no bar of its own: it stands aside while a screen's bar draws the offer. */
  pinned?: boolean;
}

/**
 * The app's one undo, wherever the open screen shows it: above a list's own
 * bar, or pinned at the bottom of a screen without one. Nothing while there
 * is nothing to undo. The offer's seconds run from when it is first seen, so
 * one made on a page that then leaves is counted on the screen it leaves for.
 */
export default function UndoNotice({ pinned = false }: UndoNoticeProps) {
  const { offer, shownAt, hosts } = useUndo();
  const drawn = offer !== null && (!pinned || hosts === 0);

  useEffect(() => {
    if (!offer || !drawn) return;
    const from = shownAt ?? Date.now();
    if (shownAt === null) undoShown(offer, from);
    const timer = setTimeout(() => endUndo(offer), Math.max(0, from + UNDO_MS - Date.now()));
    return () => clearTimeout(timer);
  }, [offer, shownAt, drawn]);

  if (!offer || !drawn) return null;
  const bar = <UndoBar message={offer.message} onAction={() => takeUndo(offer)} />;
  return pinned ? <div className={ADD_BAR_CLASS}>{bar}</div> : <div className="mb-3">{bar}</div>;
}
