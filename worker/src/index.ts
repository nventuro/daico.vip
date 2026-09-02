// =============================================================================
// The email worker: what turns a forwarded confirmation email into staged
// suggestions in Viajes. Cloudflare Email Routing hands every message sent to
// the household's address to `email()` below, which lets only a verified
// member through, has a model extract the bookings, inserts one row per
// booking into `trip_inbox`, and always replies to the sender — success or
// failure — so a forward never vanishes without a word.
//
// What the worker holds: an Anthropic key, and a Hyperdrive binding to the
// database as `trip_inbox_writer`, a role that can insert into `trip_inbox`
// and read `members` and nothing else. Never the service key: a compromised
// worker can stage junk and learn the member emails it already handles mail
// for, but read or change nothing else.
//
// Setting it up and deploying it is step 5 of the README's first-time setup;
// Cloudflare does not watch the repository, so every change is a deploy.
//
// Nothing of an email is ever logged — not its text, its attachments, nor
// what was extracted — only why a sender was turned away or what failed.
// =============================================================================
import PostalMime, { type Email } from 'postal-mime';
import { EmailMessage } from 'cloudflare:email';
import { senderRejection, type SenderRejection } from './gate';
import { decide, extractBookings, type EmailContent } from './extract';
import { countsOf, failureBody, replyMime, serviceFailureBody, successBody } from './reply';
import { insertRows, memberEmails, openDb } from './db';

export interface Env {
  ANTHROPIC_API_KEY: string;
  HYPERDRIVE: Hyperdrive;
}

const PDF_TYPE = 'application/pdf';

/** Attachments over this are left out: the text usually carries the
 *  itinerary, and a scan this size is not a confirmation. */
const PDF_MAX_BYTES = 10 * 1024 * 1024;

/** What the sending server is told; deliberately says nothing more. */
const REJECT_REASON = 'address not accepted';

function firstHeader(email: Email, key: string): string | null {
  return email.headers.find((header) => header.key === key)?.value ?? null;
}

/** The text the model reads: the plain part, or the HTML with its tags
 *  taken out when there is no plain part. */
function bodyText(email: Email): string {
  if (email.text) return email.text;
  return (email.html ?? '').replace(/<[^>]+>/g, ' ');
}

/** The PDF attachments as base64, small ones only. */
function pdfs(email: Email): string[] {
  return email.attachments.flatMap((attachment) => {
    if (attachment.mimeType !== PDF_TYPE || typeof attachment.content !== 'string') return [];
    const bytes = Math.floor((attachment.content.length * 3) / 4);
    return bytes <= PDF_MAX_BYTES ? [attachment.content] : [];
  });
}

function contentOf(email: Email): EmailContent {
  return { subject: email.subject ?? null, text: bodyText(email), pdfs: pdfs(email) };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** What is logged when a sender is turned away. Without a verdict at all,
 *  the header names say whether the receiving server stamped one under
 *  another name — never a value. */
function rejectionLog(rejection: SenderRejection, email: Email): string {
  const headers = email.headers.map((header) => header.key).join(' ');
  return rejection === 'no-verdict'
    ? `rejected: ${rejection} (headers: ${headers})`
    : `rejected: ${rejection}`;
}

export default {
  async email(message, env) {
    // Parsing is cheap and the gate needs the From header and the verdict;
    // the spend — the model — comes only after it.
    const email = await PostalMime.parse(message.raw, { attachmentEncoding: 'base64' });
    const db = await openDb(env.HYPERDRIVE.connectionString);
    try {
      const rejection = senderRejection(
        {
          envelopeFrom: message.from,
          headerFrom: email.from?.address ?? null,
          authenticationResults:
            firstHeader(email, 'authentication-results') ??
            message.headers.get('Authentication-Results'),
        },
        await memberEmails(db),
      );
      if (rejection !== null) {
        console.warn(rejectionLog(rejection, email));
        message.setReject(REJECT_REASON);
        return;
      }

      // The reply goes from the address that received the mail to the
      // envelope sender — the two the platform accepts — threaded under the
      // original.
      const reply = (body: string) =>
        message.reply(
          new EmailMessage(
            message.to,
            message.from,
            replyMime(
              {
                from: message.to,
                to: message.from,
                subject: email.subject ?? null,
                inReplyTo: email.messageId ?? null,
                references: email.references ?? null,
              },
              body,
            ),
          ),
        );

      try {
        const output = await extractBookings(env.ANTHROPIC_API_KEY, contentOf(email));
        const decision =
          output === null
            ? { ok: false as const, problem: null }
            : decide(output, email.subject ?? null);
        if (!decision.ok) {
          await reply(failureBody(decision.problem));
          return;
        }
        await insertRows(db, crypto.randomUUID(), decision.rows);
        await reply(
          successBody(decision.tripTitle, countsOf(decision.rows.map((row) => row.kind))),
        );
      } catch (error) {
        console.error(`failed: ${errorMessage(error)}`);
        try {
          await reply(serviceFailureBody());
        } catch (replyError) {
          console.error(`failed to reply: ${errorMessage(replyError)}`);
        }
      }
    } finally {
      await db.end();
    }
  },
} satisfies ExportedHandler<Env>;
