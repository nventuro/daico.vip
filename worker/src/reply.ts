// =============================================================================
// The reply a forward gets when something went wrong with it, in the member's
// words, and its assembly into a message the worker can send back.
// =============================================================================
import { createMimeMessage } from 'mimetext';
import { NO_BOOKINGS_FOUND } from './extract';

/** Where the suggestions wait for review. */
const VIAJES_URL = 'https://daico.vip/viajes';

/** The longest subject a reply carries: an encoded word longer than a line
 *  is refused by the platform, and the member hears nothing. */
const SUBJECT_MAX_CHARS = 200;

/** What to do about an email nothing came of, unless something else is. */
export const TRY_FORWARDING_AGAIN =
  'Si era una confirmación de verdad, probá reenviarla de nuevo tal cual llegó.';

/** The two lines of a reply to an email that was staged with attachments
 *  left out: how many, and where what was found went. */
export function leftOutBody(skipped: number): string {
  return [
    skipped === 1
      ? 'Dejé afuera un adjunto que no era un PDF ni una imagen, o era demasiado grande.'
      : `Dejé afuera ${skipped} adjuntos que no eran PDF ni imágenes, o eran demasiado grandes.`,
    `Lo que encontré quedó para revisar en Viajes: ${VIAJES_URL}`,
  ].join('\n');
}

/** The two lines of a reply when the email was read and nothing came of it:
 *  what was wrong with it (the model's words, or the generic line), and what
 *  to do — to forward it again, unless the problem calls for something else.
 *  A sentence the model closed with a period is opened again, since the
 *  line goes on. */
export function failureBody(problem: string | null, advice = TRY_FORWARDING_AGAIN): string {
  const said = problem?.trim().replace(/\.$/, '') || NO_BOOKINGS_FOUND;
  return [`${said}, así que no guardé nada.`, advice].join('\n');
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
