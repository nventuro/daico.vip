// =============================================================================
// The reply every forward gets, success or failure, in the member's words,
// and its assembly into a message the worker can send back.
// =============================================================================
import { createMimeMessage } from 'mimetext';
import { INBOX_KINDS, NO_BOOKINGS_FOUND, type InboxKind } from './extract';

/** Where the suggestions wait for review. */
const VIAJES_URL = 'https://daico.vip/viajes';

/** The longest subject a reply carries: an encoded word longer than a line
 *  is refused by the platform, and the member hears nothing. */
const SUBJECT_MAX_CHARS = 200;

const TRY_FORWARDING_AGAIN =
  'Si era una confirmación de verdad, probá reenviarla de nuevo tal cual llegó.';

export type KindCounts = Record<InboxKind, number>;

/** How many of each class a list of rows holds. */
export function countsOf(kinds: InboxKind[]): KindCounts {
  const counts: KindCounts = { ticket: 0, lodging: 0, booking: 0 };
  for (const kind of kinds) counts[kind] += 1;
  return counts;
}

const KIND_WORDS: Record<InboxKind, { one: string; many: string }> = {
  ticket: { one: 'un pasaje', many: 'pasajes' },
  lodging: { one: 'un alojamiento', many: 'alojamientos' },
  booking: { one: 'una reserva', many: 'reservas' },
};

function phrase(kind: InboxKind, count: number): string {
  return count === 1 ? KIND_WORDS[kind].one : `${count} ${KIND_WORDS[kind].many}`;
}

/** «a, b y c»: the parts in one breath. */
function listed(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`;
}

/** The lines of a successful reply: what was found, with how many PDFs were
 *  kept with it when any were, where it went, and how many attachments were
 *  left out when any were. */
export function successBody(
  tripTitle: string,
  counts: KindCounts,
  files: number,
  skipped = 0,
): string {
  const total = INBOX_KINDS.reduce((sum, kind) => sum + counts[kind], 0);
  const parts = INBOX_KINDS.filter((kind) => counts[kind] > 0).map((kind) =>
    phrase(kind, counts[kind]),
  );
  const kept = files > 0 ? `, con ${files} PDF` : '';
  return [
    `Encontré ${total} ${total === 1 ? 'ítem' : 'ítems'} para «${tripTitle}»: ${listed(parts)}${kept}.`,
    `Quedaron para revisar en Viajes: ${VIAJES_URL}`,
    ...(skipped > 0
      ? [
          skipped === 1
            ? 'Dejé afuera un adjunto que no era un PDF o era demasiado grande.'
            : `Dejé afuera ${skipped} adjuntos que no eran PDF o eran demasiado grandes.`,
        ]
      : []),
  ].join('\n');
}

/** The two lines of a reply to an email that was staged before: nothing is
 *  staged twice, and where the first time's suggestions are. */
export function alreadyStagedBody(): string {
  return [
    'Este correo ya lo había recibido, así que no guardé nada de nuevo.',
    `Las sugerencias de la primera vez están en Viajes: ${VIAJES_URL}`,
  ].join('\n');
}

/** The two lines of a reply when the email was read and nothing came of it:
 *  what was wrong with it (the model's words, or the generic line), and what
 *  to try. A sentence the model closed with a period is opened again, since
 *  the line goes on. */
export function failureBody(problem: string | null): string {
  const said = problem?.trim().replace(/\.$/, '') || NO_BOOKINGS_FOUND;
  return [`${said}, así que no guardé nada.`, TRY_FORWARDING_AGAIN].join('\n');
}

/** The two lines of a reply when the email was never really read — the
 *  model, the database or the reply itself failed. Forwarding it again is
 *  not the fix, and the member is told so; the log has the cause. */
export function serviceFailureBody(): string {
  return [
    'No pude procesar este correo, así que no guardé nada.',
    'Fue una falla del servicio, no del correo: probá reenviarlo más tarde.',
  ].join('\n');
}

/** Who a reply is between, and the message it answers. */
export interface ReplyEnvelope {
  from: string;
  to: string;
  subject: string | null;
  /** The original's Message-ID, so mail clients thread the reply under it. */
  inReplyTo: string | null;
  /** The original's own References header, which the reply's must carry on. */
  references: string | null;
}

/** A header value as the original wrote it, on one line: a line break in
 *  one would start a header of the sender's choosing. */
function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function bracketed(messageId: string): string {
  const id = oneLine(messageId);
  return id.startsWith('<') ? id : `<${id}>`;
}

/** The reply as raw MIME: a plain-text message threaded under the original,
 *  marked as sent by a machine so a responder on the other side does not
 *  answer it. The platform checks the threading: References has to be the
 *  original's References, when it had any, followed by its Message-ID. */
export function replyMime(envelope: ReplyEnvelope, body: string): string {
  const message = createMimeMessage();
  message.setSender(envelope.from);
  message.setRecipient(envelope.to);
  message.setSubject(
    `Re: ${oneLine(envelope.subject ?? '').slice(0, SUBJECT_MAX_CHARS)}`.trimEnd(),
  );
  message.setHeader('Auto-Submitted', 'auto-replied');
  if (envelope.inReplyTo !== null) {
    const id = bracketed(envelope.inReplyTo);
    message.setHeader('In-Reply-To', id);
    const references = envelope.references && oneLine(envelope.references);
    message.setHeader('References', references ? `${references} ${id}` : id);
  }
  message.addMessage({ contentType: 'text/plain', data: body });
  return message.asRaw();
}
