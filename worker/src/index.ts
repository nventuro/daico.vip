// =============================================================================
// The email worker: what turns a forwarded confirmation email into staged
// suggestions in Viajes. Cloudflare Email Routing hands every message sent to
// the household's address to `email()` below, which lets only a verified
// member through, has a model extract the bookings, seals the PDFs the
// bookings are printed in for the household, inserts one row per booking
// into `trip_inbox` with those PDFs beside it, and always replies to the
// sender — success or failure — so a forward never vanishes without a word.
//
// What the worker holds: an Anthropic key, and a Hyperdrive binding to the
// database as `trip_inbox_writer`, a role that can insert into `trip_inbox`,
// its files and the record of which emails were staged, and read `members`,
// that record and the household's inbox public key, and nothing else. Never
// the service key, and never a key that opens a file: a compromised worker
// can stage junk and learn the member emails it already handles mail for,
// but read or change nothing else.
//
// Setting it up and deploying it is step 5 of the README's first-time setup;
// Cloudflare does not watch the repository, so every change is a deploy.
//
// Nothing of an email is ever logged — not its text, its attachments, nor
// what was extracted — only why a sender was turned away or what failed.
// =============================================================================
import PostalMime, { type Email } from 'postal-mime';
import { EmailMessage } from 'cloudflare:email';
import type pg from 'pg';
import { memberRejection, verdictRejection, type SenderRejection } from './gate';
import {
  decide,
  extractBookings,
  type EmailContent,
  type EmailPdf,
  type InboxRow,
} from './extract';
import {
  alreadyStagedBody,
  countsOf,
  failureBody,
  replyMime,
  serviceFailureBody,
  successBody,
} from './reply';
import {
  AlreadyStagedError,
  alreadyStaged,
  inboxPublicKey,
  insertRows,
  memberEmails,
  openDb,
  type InboxFile,
} from './db';
import { importInboxPublicKey, inboxFileBinding, sealPdf } from './seal';
import { toBase64 } from './base64';

export interface Env {
  ANTHROPIC_API_KEY: string;
  HYPERDRIVE: Hyperdrive;
}

const PDF_TYPE = 'application/pdf';
/** What a PDF's bytes open with, whatever the attachment says it is. */
const PDF_MAGIC = '%PDF-';

/** Attachments over this are left out: the text usually carries the
 *  itinerary, and a scan this size is not a confirmation. It is also the
 *  largest file the app attaches, so a PDF kept here is one the app takes. */
const PDF_MAX_BYTES = 10 * 1024 * 1024;
/** How many PDFs, and how many bytes of them together, one email may send
 *  the model: what the model takes in one request has a ceiling, and every
 *  byte of it is billed. */
const PDF_MAX_COUNT = 4;
const PDFS_MAX_BYTES = 16 * 1024 * 1024;
/** How much of an email's text the model reads. */
const TEXT_MAX_CHARS = 60_000;
/** The longest Message-ID kept: a header line's worth. */
const MESSAGE_ID_MAX_CHARS = 998;

/** What the sending server is told; deliberately says nothing more. */
const REJECT_REASON = 'address not accepted';

function firstHeader(email: Email, key: string): string | null {
  return email.headers.find((header) => header.key === key)?.value ?? null;
}

/** Whether the mail was sent by a machine answering another mail — a
 *  vacation responder, a bounce — which the reply would only set off again. */
function isAutoSubmitted(email: Email): boolean {
  const auto = firstHeader(email, 'auto-submitted')?.trim().toLowerCase();
  if (auto !== undefined && auto !== 'no') return true;
  if (firstHeader(email, 'x-auto-response-suppress') !== null) return true;
  const precedence = firstHeader(email, 'precedence')?.trim().toLowerCase();
  return precedence === 'bulk' || precedence === 'junk' || precedence === 'auto_reply';
}

/** The email's Message-ID as it is kept: one line, cut to length; null when
 *  it has none. */
function normalizedMessageId(messageId: string | null): string | null {
  const value = (messageId ?? '').replace(/[\r\n]/g, '').trim();
  return value === '' ? null : value.slice(0, MESSAGE_ID_MAX_CHARS);
}

/** The text the model reads: the plain part, or the HTML with its tags
 *  taken out when there is no plain part. */
function bodyText(email: Email): string {
  if (email.text) return email.text;
  return (email.html ?? '').replace(/<[^>]+>/g, ' ');
}

/** An attachment's name as the app will show it: the extension off, since
 *  the type already says what the file is. */
function attachmentName(filename: string | null): string {
  return (filename ?? '').replace(/\.[^.]*$/, '').trim();
}

function bytesOf(content: ArrayBuffer | Uint8Array | string): Uint8Array | null {
  if (content instanceof Uint8Array) return content;
  if (content instanceof ArrayBuffer) return new Uint8Array(content);
  return null;
}

function isPdf(bytes: Uint8Array): boolean {
  return new TextDecoder().decode(bytes.subarray(0, PDF_MAGIC.length)) === PDF_MAGIC;
}

/** The PDF attachments, in the email's order, as many as the model takes:
 *  what says it is a PDF or is named one, and opens as one. The rest of
 *  those are counted, for the reply to say. */
function pdfs(email: Email): { kept: EmailPdf[]; skipped: number } {
  const kept: EmailPdf[] = [];
  let skipped = 0;
  let bytesKept = 0;
  for (const attachment of email.attachments) {
    const named = attachment.filename?.toLowerCase().endsWith('.pdf') ?? false;
    if (attachment.mimeType !== PDF_TYPE && !named) continue;
    const bytes = bytesOf(attachment.content);
    if (
      bytes === null ||
      bytes.length === 0 ||
      bytes.length > PDF_MAX_BYTES ||
      !isPdf(bytes) ||
      kept.length === PDF_MAX_COUNT ||
      bytesKept + bytes.length > PDFS_MAX_BYTES
    ) {
      skipped += 1;
      continue;
    }
    kept.push({ name: attachmentName(attachment.filename), bytes });
    bytesKept += bytes.length;
  }
  return { kept, skipped };
}

function contentOf(email: Email): { content: EmailContent; skipped: number } {
  const { kept, skipped } = pdfs(email);
  return {
    content: {
      subject: email.subject ?? null,
      text: bodyText(email).slice(0, TEXT_MAX_CHARS),
      pdfs: kept,
    },
    skipped,
  };
}

/** The PDFs some row is printed in, sealed for the household, each bound to
 *  the row it is staged as; the rest of the email's PDFs are forgotten here. */
async function sealNamed(
  pdfs: EmailPdf[],
  fileIds: string[],
  rows: InboxRow[],
  publicKey: CryptoKey,
): Promise<InboxFile[]> {
  const named = new Set(rows.flatMap((row) => row.file_ids));
  const files: InboxFile[] = [];
  for (const [index, pdf] of pdfs.entries()) {
    const id = fileIds[index];
    if (!named.has(id)) continue;
    const { data, wrappedKey } = await sealPdf(publicKey, pdf.bytes, inboxFileBinding(id));
    files.push({
      id,
      name: pdf.name,
      size: pdf.bytes.length,
      data: toBase64(data),
      wrapped_key: wrappedKey,
    });
  }
  return files;
}

/** The rows as they are staged while the household has no inbox key: with
 *  nothing sealed, no row may name a file. */
function withoutFiles(rows: InboxRow[]): InboxRow[] {
  return rows.map((row) => ({ ...row, file_ids: [] }));
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
    let db: pg.Client | null = null;
    try {
      // Parsing is cheap and the gate needs the From header and the verdict;
      // the database comes after the verdict, and the spend — the model —
      // only after the gate.
      const email = await PostalMime.parse(message.raw, { attachmentEncoding: 'arraybuffer' });
      if (isAutoSubmitted(email)) {
        // A machine answering a machine: dropped without a word, or the two
        // would answer each other until one gave up.
        console.warn('dropped: auto-submitted');
        return;
      }
      const verdict = verdictRejection(firstHeader(email, 'authentication-results'));
      if (verdict !== null) {
        console.warn(rejectionLog(verdict, email));
        message.setReject(REJECT_REASON);
        return;
      }
      db = await openDb(env.HYPERDRIVE.connectionString);
      const rejection = memberRejection(
        { envelopeFrom: message.from, headerFrom: email.from?.address ?? null },
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
        // An email delivered again — the sending server never got the first
        // delivery's answer — is answered again, and read and staged once.
        const messageId = normalizedMessageId(email.messageId ?? null);
        if (messageId !== null && (await alreadyStaged(db, messageId))) {
          await reply(alreadyStagedBody());
          return;
        }
        const { content, skipped } = contentOf(email);
        // Each PDF gets the id it would be staged under before the model
        // names any, so the rows are built with the ids in hand.
        const fileIds = content.pdfs.map(() => crypto.randomUUID());
        const output = await extractBookings(env.ANTHROPIC_API_KEY, content);
        const decision =
          output === null
            ? { ok: false as const, problem: null }
            : decide(output, email.subject ?? null, fileIds);
        if (!decision.ok) {
          await reply(failureBody(decision.problem));
          return;
        }
        const publicKey = await inboxPublicKey(db);
        const { rows, files } =
          publicKey === null
            ? { rows: withoutFiles(decision.rows), files: [] }
            : {
                rows: decision.rows,
                files: await sealNamed(
                  content.pdfs,
                  fileIds,
                  decision.rows,
                  await importInboxPublicKey(publicKey),
                ),
              };
        try {
          await insertRows(db, crypto.randomUUID(), rows, files, messageId);
        } catch (error) {
          // Two deliveries read at once: the other one staged it first.
          if (error instanceof AlreadyStagedError) {
            await reply(alreadyStagedBody());
            return;
          }
          throw error;
        }
        await reply(
          successBody(
            decision.tripTitle,
            countsOf(rows.map((row) => row.kind)),
            files.length,
            skipped,
          ),
        );
      } catch (error) {
        console.error(`failed: ${errorMessage(error)}`);
        try {
          await reply(serviceFailureBody());
        } catch (replyError) {
          console.error(`failed to reply: ${errorMessage(replyError)}`);
        }
      }
    } catch (error) {
      // Before the gate — the mail could not be read, or the database not
      // reached — there is no one to answer yet, and the sending server is
      // told to try again later, in as many words.
      console.error(`failed before the gate: ${errorMessage(error)}`);
      throw new Error('temporary failure');
    } finally {
      await db?.end().catch(() => undefined);
    }
  },
} satisfies ExportedHandler<Env>;
