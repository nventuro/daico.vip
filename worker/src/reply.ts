// =============================================================================
// The reply every forward gets, success or failure, in the member's words,
// and its assembly into a message the worker can send back.
// =============================================================================
import { createMimeMessage } from 'mimetext';
import { INBOX_KINDS, type InboxKind } from './extract';

/** Where the suggestions wait for review. */
const VIAJES_URL = 'https://daico.vip/viajes';

/** What is said when the model found nothing and did not say why. */
export const NO_BOOKINGS_FOUND = 'No encontré ninguna reserva en este correo';

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

/** The two lines of a successful reply: what was found, with how many PDFs
 *  were kept with it when any were, and where it went. */
export function successBody(tripTitle: string, counts: KindCounts, files: number): string {
  const total = INBOX_KINDS.reduce((sum, kind) => sum + counts[kind], 0);
  const parts = INBOX_KINDS.filter((kind) => counts[kind] > 0).map((kind) =>
    phrase(kind, counts[kind]),
  );
  const kept = files > 0 ? `, con ${files} PDF` : '';
  return [
    `Encontré ${total} ${total === 1 ? 'ítem' : 'ítems'} para «${tripTitle}»: ${listed(parts)}${kept}.`,
    `Quedaron para revisar en Viajes: ${VIAJES_URL}`,
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

function bracketed(messageId: string): string {
  const id = messageId.trim();
  return id.startsWith('<') ? id : `<${id}>`;
}

/** The reply as raw MIME: a plain-text message threaded under the original.
 *  The platform checks the threading: References has to be the original's
 *  References, when it had any, followed by its Message-ID. */
export function replyMime(envelope: ReplyEnvelope, body: string): string {
  const message = createMimeMessage();
  message.setSender(envelope.from);
  message.setRecipient(envelope.to);
  message.setSubject(`Re: ${envelope.subject ?? ''}`.trimEnd());
  if (envelope.inReplyTo !== null) {
    const id = bracketed(envelope.inReplyTo);
    message.setHeader('In-Reply-To', id);
    const references = envelope.references?.trim();
    message.setHeader('References', references ? `${references} ${id}` : id);
  }
  message.addMessage({ contentType: 'text/plain', data: body });
  return message.asRaw();
}
