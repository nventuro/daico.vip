import { describe, it, expect } from 'vitest';
import { countsOf, failureBody, replyMime, serviceFailureBody, successBody } from './reply';

describe('successBody', () => {
  it('says one item in the singular, with its class', () => {
    expect(successBody('Bariloche', countsOf(['ticket']), 0)).toBe(
      'Encontré 1 ítem para «Bariloche»: un pasaje.\nQuedaron para revisar en Viajes: https://daico.vip/viajes',
    );
    expect(successBody('Bariloche', countsOf(['lodging']), 0)).toContain(': un alojamiento.');
    expect(successBody('Bariloche', countsOf(['booking']), 0)).toContain(': una reserva.');
  });

  it('lists the classes in their order, plurals where there are two, and « y » before the last', () => {
    const counts = countsOf(['booking', 'ticket', 'lodging', 'ticket', 'booking']);
    expect(successBody('Bariloche', counts, 0)).toBe(
      'Encontré 5 ítems para «Bariloche»: 2 pasajes, un alojamiento y 2 reservas.\nQuedaron para revisar en Viajes: https://daico.vip/viajes',
    );
    expect(successBody('Bariloche', countsOf(['ticket', 'ticket']), 0)).toContain(': 2 pasajes.');
    expect(successBody('Bariloche', countsOf(['lodging', 'lodging']), 0)).toContain(
      ': 2 alojamientos.',
    );
    expect(successBody('Bariloche', countsOf(['booking', 'booking']), 0)).toContain(
      ': 2 reservas.',
    );
    expect(successBody('Bariloche', countsOf(['ticket', 'booking']), 0)).toContain(
      ': un pasaje y una reserva.',
    );
  });

  it('says how many PDFs were kept, and nothing when none were', () => {
    expect(successBody('Bariloche', countsOf(['ticket', 'ticket']), 1)).toBe(
      'Encontré 2 ítems para «Bariloche»: 2 pasajes, con 1 PDF.\nQuedaron para revisar en Viajes: https://daico.vip/viajes',
    );
    expect(successBody('Bariloche', countsOf(['ticket', 'lodging']), 2)).toContain(
      ': un pasaje y un alojamiento, con 2 PDF.',
    );
    expect(successBody('Bariloche', countsOf(['ticket']), 0)).not.toContain('PDF');
  });
});

describe('failureBody', () => {
  const second = 'Si era una confirmación de verdad, probá reenviarla de nuevo tal cual llegó.';

  it('falls back to the generic line when the model said nothing', () => {
    expect(failureBody(null)).toBe(
      `No encontré ninguna reserva en este correo, así que no guardé nada.\n${second}`,
    );
    expect(failureBody('  ')).toBe(failureBody(null));
  });

  it("carries the model's words, opened again if it closed them", () => {
    expect(failureBody('Es un recibo, no una confirmación.')).toBe(
      `Es un recibo, no una confirmación, así que no guardé nada.\n${second}`,
    );
  });
});

describe('serviceFailureBody', () => {
  it('says the service failed, not the email, and does not ask for it again', () => {
    expect(serviceFailureBody()).toBe(
      'No pude procesar este correo, así que no guardé nada.\nFue una falla del servicio, no del correo: probá reenviarlo más tarde.',
    );
  });
});

describe('replyMime', () => {
  it('threads a plain-text reply under the original', () => {
    const raw = replyMime(
      {
        from: 'trips@example.com',
        to: 'member@example.com',
        subject: 'Fwd: Tu vuelo',
        inReplyTo: 'abc@mail.example',
        references: null,
      },
      'Hola',
    );
    expect(raw).toContain('From: <trips@example.com>');
    expect(raw).toContain('To: <member@example.com>');
    // The subject is sent as an encoded word, whatever it holds.
    expect(raw).toContain(
      `Subject: =?utf-8?B?${Buffer.from('Re: Fwd: Tu vuelo').toString('base64')}?=`,
    );
    expect(raw).toContain('In-Reply-To: <abc@mail.example>');
    expect(raw).toContain('References: <abc@mail.example>');
  });

  it('carries the original References on, ending in its Message-ID', () => {
    const raw = replyMime(
      {
        from: 'trips@example.com',
        to: 'member@example.com',
        subject: 'Fwd: Tu vuelo',
        inReplyTo: '<fwd@mail.example>',
        references: ' <origin@sender.example> <earlier@sender.example> ',
      },
      'Hola',
    );
    expect(raw).toContain(
      'References: <origin@sender.example> <earlier@sender.example> <fwd@mail.example>',
    );
    expect(raw).toContain('In-Reply-To: <fwd@mail.example>');
    expect(raw).toContain('Content-Type: text/plain');
    expect(raw).toContain('Hola');
  });

  it('keeps an id that already has its brackets, and copes with no subject or id', () => {
    const raw = replyMime(
      {
        from: 'a@x.example',
        to: 'b@x.example',
        subject: null,
        inReplyTo: '<id@x>',
        references: null,
      },
      'Hola',
    );
    expect(raw).toContain('In-Reply-To: <id@x>');
    expect(raw).toContain(`Subject: =?utf-8?B?${Buffer.from('Re:').toString('base64')}?=`);
    const bare = replyMime(
      { from: 'a@x.example', to: 'b@x.example', subject: null, inReplyTo: null, references: null },
      'Hola',
    );
    expect(bare).not.toContain('In-Reply-To');
  });
});
