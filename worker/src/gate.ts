/**
 * Who an email says it is from, and what the receiving mail server made of
 * that: the envelope sender, the address in the From header, and the first
 * Authentication-Results header — the receiving server stamps its own above
 * any the message arrived with, so the first is its verdict.
 */
export interface Sender {
  envelopeFrom: string;
  headerFrom: string | null;
  authenticationResults: string | null;
}

/** Why a sender is turned away; only ever logged, never told to the sender,
 *  who gets no reply at all. */
export type SenderRejection =
  'no-verdict' | 'dmarc-failed' | 'envelope-not-member' | 'from-not-member';

// The DMARC verdict is the one that ties the signature to the domain in the
// From header: a forger can sign with a domain of their own and still get
// `dkim=pass`, but not `dmarc=pass` for the member's.
const DMARC_PASS = /(?:^|[\s;])dmarc=pass(?=$|[\s;(])/i;

function normalized(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Whether an email may go on to be read, and if not, why. Both addresses have
 * to be a member's: the From header is what the DMARC verdict vouches for,
 * and the envelope sender is where the reply goes.
 */
export function senderRejection(sender: Sender, memberEmails: string[]): SenderRejection | null {
  if (sender.authenticationResults === null) return 'no-verdict';
  if (!DMARC_PASS.test(sender.authenticationResults)) return 'dmarc-failed';
  const members = new Set(memberEmails.map(normalized));
  if (!members.has(normalized(sender.envelopeFrom))) return 'envelope-not-member';
  if (sender.headerFrom === null || !members.has(normalized(sender.headerFrom))) {
    return 'from-not-member';
  }
  return null;
}

export function isAllowedSender(sender: Sender, memberEmails: string[]): boolean {
  return senderRejection(sender, memberEmails) === null;
}
