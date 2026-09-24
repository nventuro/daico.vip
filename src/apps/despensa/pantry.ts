import type { PantryItem, PantryPlace } from '../../lib/offline/specs';
import {
  dueWord,
  formatDateShort,
  formatMonthYear,
  isPast,
  monthEnd,
  withinNotice,
} from '../../utils/dateUtils';
import { PANTRY_PLACE_LABELS } from './labels';

/** How many days ahead of its expiry an item shows in Próximo and on top of
 *  the list: two weeks, time enough to plan a meal around it. */
export const PANTRY_NOTICE_DAYS = 14;

/** Where a new item is put until its page says otherwise: what is bought once
 *  is mostly kept dry. */
export const PANTRY_PLACE_DEFAULT: PantryPlace = 'cupboard';

export function isUsed(item: PantryItem): boolean {
  return item.used_on !== null;
}

/** Whether an item still in the house expires within two weeks of `today`, or
 *  already did — one that went off stays announced until it is marked, since
 *  that is when it needs deciding about. */
export function isExpiring(item: PantryItem, today: string): boolean {
  return (
    !isUsed(item) &&
    item.expires_on !== null &&
    withinNotice(today, item.expires_on, PANTRY_NOTICE_DAYS)
  );
}

/** Whether an item still in the house is past the day it was good through. */
export function isGoneOff(item: PantryItem, today: string): boolean {
  return !isUsed(item) && item.expires_on !== null && isPast(item.expires_on, today);
}

export interface PantryGroups {
  /** Expiring within two weeks, or already gone off: what the list is about. */
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

/** The expiry as it is written. */
type ExpiryPatch = Partial<Pick<PantryItem, 'expires_on' | 'expires_month_only'>>;

/** What setting an item's expiry writes: the day as given, or — for a package
 *  that prints only the month — that month's last day, the day it is good
 *  through. Taking the date away takes the month-only flag with it, since the
 *  flag means nothing without one. */
export function expiryPatch(item: PantryItem, expiresOn: string | null): ExpiryPatch {
  if (expiresOn === null) return { expires_on: null, expires_month_only: false };
  return { expires_on: item.expires_month_only ? monthEnd(expiresOn) : expiresOn };
}

/** What saying the package gave only the month writes: the date moves to the
 *  month's last day. Saying otherwise leaves it there, to be picked again, and
 *  an item with no date has no month to keep. */
export function monthOnlyPatch(item: PantryItem, monthOnly: boolean): ExpiryPatch {
  if (!monthOnly || item.expires_on === null) return { expires_month_only: false };
  return { expires_month_only: true, expires_on: monthEnd(item.expires_on) };
}

/** When an item expires as its package says it: "vence 05/10/2026", "venció
 *  22/09/2026", or only the month for a package that gives no day: "vence
 *  03/2027". */
export function expiryLabel(expiresOn: string, monthOnly: boolean, today: string): string {
  return `${dueWord(expiresOn, today)} ${monthOnly ? formatMonthYear(expiresOn) : formatDateShort(expiresOn)}`;
}

/** The line under an item wherever it is listed: when it expires — or when it
 *  was used — and where it is kept. */
export function itemSubtitle(item: PantryItem, today: string): string {
  const when =
    item.used_on !== null
      ? `usado ${formatDateShort(item.used_on)}`
      : item.expires_on !== null
        ? expiryLabel(item.expires_on, item.expires_month_only, today)
        : 'sin fecha';
  return `${when} · ${PANTRY_PLACE_LABELS[item.place].toLowerCase()}`;
}
