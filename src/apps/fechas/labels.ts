import type { RepeatKind } from '../../types';

/** How a date repeats, as shown to the user. */
export function repeatLabel(repeat: RepeatKind, months: number | null): string {
  switch (repeat) {
    case 'none':
      return 'Una vez';
    case 'yearly':
      return 'Cada año';
    case 'months':
      return months === 1 ? 'Cada mes' : `Cada ${months} meses`;
  }
}
