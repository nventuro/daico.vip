import type { DocumentEntry } from '../../lib/offline/specs';
import { daysUntil, dueWord, formatDateShort } from '../../utils/dateUtils';

/** How many days ahead of its expiry a document shows on the home screen: six
 *  months, the margin a passport is often required to have left, and time
 *  enough to renew anything else. The same for every document. */
const DOCUMENT_NOTICE_DAYS = 180;

/**
 * Whether a document's expiry is close enough to announce on `today`: within
 * six months, or already past — an expired document stays announced until its
 * expiry is updated, since that is exactly when it needs attention.
 */
export function isExpiring(entry: DocumentEntry, today: string): boolean {
  return entry.expires_on !== null && daysUntil(today, entry.expires_on) <= DOCUMENT_NOTICE_DAYS;
}

/** "vence dd/mm/yyyy", or "venció" once the day has gone by. */
export function expiryLabel(expiresOn: string, today: string): string {
  return `${dueWord(expiresOn, today)} ${formatDateShort(expiresOn)}`;
}
