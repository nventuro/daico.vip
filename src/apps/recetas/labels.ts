import { countLabel } from '../../utils/textUtils';

/** A recipe's total time, as shown to the user. */
export function minutesLabel(minutes: number): string {
  return `${minutes} min`;
}

/** How many portions a recipe yields, as shown to the user. */
export function servingsLabel(servings: number): string {
  return countLabel(servings, 'porción', 'porciones');
}
