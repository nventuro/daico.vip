import { useEffect, type ReactNode } from 'react';
import { registerUndoHost } from '../lib/undo';
import { ADD_BAR_CLASS } from './controlClasses';
import UndoNotice from './UndoNotice';

/** The bar pinned to the bottom of a screen, within thumb reach: what a list
 *  adds from, or the one action it offers. The app's undo shows here while it
 *  stands, above whatever the bar holds; a screen with no bar of its own gets
 *  the shell's, holding the undo alone. */
export default function BottomBar({ children }: { children: ReactNode }) {
  useEffect(() => registerUndoHost(), []);
  return (
    <div className={ADD_BAR_CLASS}>
      <UndoNotice />
      {children}
    </div>
  );
}
