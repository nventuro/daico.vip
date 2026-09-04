// =============================================================================
// The one thing in the app that can currently be undone: a mark, a clear, a
// group of rows just confirmed. It is offered by whichever screen did it and
// shown by whichever screen is open — above a list's own bar, pinned at the
// bottom elsewhere — so a mark made on an entry's page is undone on the screen
// the page leaves for.
// =============================================================================

/** How long (ms) an undo stays offered once it is on screen. */
export const UNDO_MS = 5000;

export interface UndoOffer {
  /** What just happened, e.g. "Tarea hecha". */
  message: string;
  /** What reverses it. */
  undo: () => unknown;
  /** Called once the offer is over: taken, or let go of — timed out, replaced
   *  by a later offer, or withdrawn by whoever made it. */
  onEnd?: (taken: boolean) => void;
}

export interface UndoState {
  offer: UndoOffer | null;
  /** When the offer was first put on screen; its seconds run from there. */
  shownAt: number | null;
  /** How many screens with a bar of their own are open, each drawing the
   *  offer above it; the shell pins it at the bottom only while there are none. */
  hosts: number;
}

let state: UndoState = { offer: null, shownAt: null, hosts: 0 };
const listeners = new Set<() => void>();

function set(next: Partial<UndoState>): void {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

/** The standing offer and where it is shown; one object until something changes. */
export function undoState(): UndoState {
  return state;
}

export function subscribeUndo(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Offers `next` as the one thing to undo, in place of whatever was: an
 *  earlier offer still standing is let go of. */
export function offerUndo(next: UndoOffer): void {
  const previous = state.offer;
  set({ offer: next, shownAt: null });
  previous?.onEnd?.(false);
}

/** Takes `offer` — runs what reverses it — if it is still the one standing. */
export function takeUndo(offer: UndoOffer): void {
  if (state.offer !== offer) return;
  set({ offer: null, shownAt: null });
  void offer.undo();
  offer.onEnd?.(true);
}

/** Lets `offer` go untaken, if it is still the one standing. */
export function endUndo(offer: UndoOffer): void {
  if (state.offer !== offer) return;
  set({ offer: null, shownAt: null });
  offer.onEnd?.(false);
}

/** Notes when `offer` was first put on screen; a later sighting changes nothing. */
export function undoShown(offer: UndoOffer, at: number): void {
  if (state.offer !== offer || state.shownAt !== null) return;
  set({ shownAt: at });
}

/** Registers a screen with a bar of its own, which draws the offer above it;
 *  returns what unregisters it. */
export function registerUndoHost(): () => void {
  set({ hosts: state.hosts + 1 });
  return () => set({ hosts: state.hosts - 1 });
}
