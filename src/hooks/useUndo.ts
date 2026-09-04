import { useSyncExternalStore } from 'react';
import { subscribeUndo, undoState, type UndoState } from '../lib/undo';

/** The app's one standing undo, and where it is shown, as the shell holds it.
 *  Read the same way when a screen is rendered to markup, as the tests do. */
export function useUndo(): UndoState {
  return useSyncExternalStore(subscribeUndo, undoState, undoState);
}
