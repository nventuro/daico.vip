import type { PantryItem, PantryPlace } from '../../lib/offline/specs';
import {
  dueWord,
  formatDateShort,
  formatMonthYear,
  isPast,
  monthEnd,
  monthsUntil,
} from '../../utils/dateUtils';
import { PANTRY_PLACE_LABELS } from './labels';

/** How many months ahead of going off an item shows in Próximo and on top of
 *  the list, counting the month it expires in: from that month's first day,
 *  a month of meals to fit it into. */
export const PANTRY_NOTICE_MONTHS = 1;

/** Where a new item is put until its page says otherwise: what is bought once
 *  is mostly kept dry. */
export const PANTRY_PLACE_DEFAULT: PantryPlace = 'cupboard';

export function isUsed(item: PantryItem): boolean {
  return item.used_on !== null;
}

/** Whether an item still in the house expires within the notice months of
 *  `today`, or already did — one that went off stays announced until it is
 *  marked, since that is when it needs deciding about. */
export function isExpiring(item: PantryItem, today: string): boolean {
  return (
    !isUsed(item) &&
    item.expires_on !== null &&
    monthsUntil(today, item.expires_on) < PANTRY_NOTICE_MONTHS
  );
}

/** Whether an item still in the house is past the day it was good through. */
export function isGoneOff(item: PantryItem, today: string): boolean {
  return !isUsed(item) && item.expires_on !== null && isPast(item.expires_on, today);
}

export interface PantryGroups {
  /** Expiring within the notice months, or already gone off: what the list is
   *  about. */
  soon: PantryItem[];
  /** Everything else still in the house, the undated last. */
  later: PantryItem[];
  used: PantryItem[];
}

/** The last used first. */
function compareLastUsed(a: PantryItem, b: PantryItem): number {
  return (b.used_on ?? '').localeCompare(a.used_on ?? '');
}

/**
 * Items split into the three groups the list draws: what is still in the
 * house keeping the order it came in (by expiry, undated last), and what was
 * used with the one used last first.
 */
export function groupPantry(items: PantryItem[], today: string): PantryGroups {
  return {
    soon: items.filter((item) => isExpiring(item, today)),
    later: items.filter((item) => !isUsed(item) && !isExpiring(item, today)),
    used: items.filter(isUsed).sort(compareLastUsed),
  };
}

/** What an item's `expires_on` holds for the month (yyyy-mm) it expires in:
 *  that month's last day, the day it is good through. */
export function expiryOf(yearMonth: string | null): string | null {
  return yearMonth === null ? null : monthEnd(`${yearMonth}-01`);
}

/** The month an item expires in, as the package prints it: "vence 10/2026",
 *  and "venció 08/2026" once that month is over. */
export function expiryLabel(expiresOn: string, today: string): string {
  return `${dueWord(expiresOn, today)} ${formatMonthYear(expiresOn)}`;
}

/** The line under an item wherever it is listed: when it expires — or when it
 *  was used — and where it is kept. */
export function itemSubtitle(item: PantryItem, today: string): string {
  const when =
    item.used_on !== null
      ? `usado ${formatDateShort(item.used_on)}`
      : item.expires_on !== null
        ? expiryLabel(item.expires_on, today)
        : 'sin fecha';
  return `${when} · ${PANTRY_PLACE_LABELS[item.place].toLowerCase()}`;
}
