import type { DocumentEntry } from '../../lib/offline/specs';
import { daysUntil, dueWord, formatDateShort } from '../../utils/dateUtils';

/**
 * Whether a document's expiry is close enough to announce on `today`: inside
 * its notice window, or already past — an expired document stays announced
 * until its expiry is updated, since that is exactly when it needs attention.
 */
export function isExpiring(entry: DocumentEntry, today: string): boolean {
  return entry.expires_on !== null && daysUntil(today, entry.expires_on) <= entry.notice_days;
}

/** "vence dd/mm/yyyy", or "venció" once the day has gone by. */
export function expiryLabel(expiresOn: string, today: string): string {
  return `${dueWord(expiresOn, today)} ${formatDateShort(expiresOn)}`;
}
