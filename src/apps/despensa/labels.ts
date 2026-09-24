import type { PantryPlace } from '../../lib/offline/specs';

/** What each place is called: the word its chip offers. */
export const PANTRY_PLACE_LABELS: Record<PantryPlace, string> = {
  cupboard: 'Alacena',
  fridge: 'Heladera',
  freezer: 'Freezer',
};

/** What an item marked used is said to be: by the undo, and by its page's
 *  square. */
export const USED_LABEL = 'Usado';
