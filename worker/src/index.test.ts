import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { RECEIVING_SERVER } from './gate';
import type { Env } from './index';

// The platform's own module, and the outside the worker talks to: the
// database and the model. The gate under test is what stands between an
// email and both.
vi.mock('cloudflare:email', () => ({
  EmailMessage: class {
    constructor(
      readonly from: string,
      readonly to: string,
      readonly raw: string,
    ) {}
  },
}));
vi.mock('./db', () => ({
  openDb: vi.fn(async () => ({ end: vi.fn(async () => {}) })),
  memberEmails: vi.fn(async () => ['member@example.com']),
  inboxPublicKey: vi.fn(async () => null),
  alreadyStaged: vi.fn(async () => false),
  insertRows: vi.fn(async () => {}),
  AlreadyStagedError: class extends Error {},
}));
vi.mock('./extract', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./extract')>()),
  extractBookings: vi.fn(async () => null),
}));

const { default: worker } = await import('./index');
const { extractBookings, LINK_MARK } = await import('./extract');
const { openDb, alreadyStaged, inboxPublicKey, insertRows, AlreadyStagedError } =
  await import('./db');

const ENV: Env = {
  ANTHROPIC_API_KEY: 'key',
  HYPERDRIVE: { connectionString: 'postgres://db' } as Hyperdrive,
};

/** A forwarded email as the platform hands it over, with the given
 *  Authentication-Results headers in the given order, the first on top,
 *  any other headers after them, and the given text. */
function forwarded(verdicts: string[], headers: string[] = [], text = 'Reenviado.') {
  const raw = [
    ...verdicts.map((verdict) => `Authentication-Results: ${verdict}`),
    ...headers,
    'From: Member <member@example.com>',
    'To: viajes@household.example',
    'Subject: Reserva',
    'Message-ID: <one@example.com>',
    'Content-Type: text/plain; charset=utf-8',
    '',
    text,
  ].join('\r\n');
  return {
    raw,
    from: 'member@example.com',
    to: 'viajes@household.example',
    headers: new Headers(),
    setReject: vi.fn(),
    reply: vi.fn(async () => {}),
  };
}

async function handle(message: ReturnType<typeof forwarded>): Promise<void> {
  await worker.email(message as unknown as ForwardableEmailMessage, ENV);
}

/** The body of the reply the sender got. */
function replied(message: ReturnType<typeof forwarded>): string {
  const [sent] = message.reply.mock.calls[0] as unknown as [{ raw: string }];
  return sent.raw;
}

const OWN_PASS = `${RECEIVING_SERVER}; dmarc=pass header.from=example.com`;
const OWN_FAIL = `${RECEIVING_SERVER}; dmarc=fail header.from=example.com`;

beforeEach(() => {
  vi.mocked(extractBookings).mockClear();
  vi.mocked(openDb).mockClear();
  vi.mocked(alreadyStaged).mockReset().mockResolvedValue(false);
  vi.mocked(insertRows).mockReset().mockResolvedValue(undefined);
});

describe('the gate on a forwarded email', () => {
  it("reads the first verdict only: a pass the message carried under the server's fail is turned away", async () => {
    const message = forwarded([OWN_FAIL, OWN_PASS]);
    await handle(message);
    expect(message.setReject).toHaveBeenCalledWith('address not accepted');
    expect(message.reply).not.toHaveBeenCalled();
    expect(extractBookings).not.toHaveBeenCalled();
  });

  it('turns away a verdict headed by anyone but the receiving server, before opening the database', async () => {
    const message = forwarded(['mx.example.net; dmarc=pass header.from=example.com']);
    await handle(message);
    expect(message.setReject).toHaveBeenCalled();
    expect(openDb).not.toHaveBeenCalled();
    expect(extractBookings).not.toHaveBeenCalled();
  });

  it("lets a member through on the server's own pass, whatever the message carried below it", async () => {
    const message = forwarded([OWN_PASS, 'mx.example.net; dmarc=fail header.from=example.com']);
    await handle(message);
    expect(message.setReject).not.toHaveBeenCalled();
    expect(extractBookings).toHaveBeenCalledTimes(1);
    expect(message.reply).toHaveBeenCalledTimes(1);
  });

  it("drops a machine's own reply without answering it", async () => {
    const message = forwarded([OWN_PASS], ['Auto-Submitted: auto-replied']);
    await handle(message);
    expect(message.setReject).not.toHaveBeenCalled();
    expect(message.reply).not.toHaveBeenCalled();
    expect(extractBookings).not.toHaveBeenCalled();
  });
});

describe("the email's text", () => {
  it('reaches the model with the mark in place of every address, bare or in angle brackets', async () => {
    const message = forwarded(
      [OWN_PASS],
      [],
      [
        'Tu reserva <https://click.example.com/ls/click?upn=u001.Kq0khUdk-2BSZmtN> esta lista.',
        'Check-in: http://example.com/checkin?pnr=QK7T2M',
        'Reserva QK7T2M',
      ].join('\r\n'),
    );
    await handle(message);
    const [, content] = vi.mocked(extractBookings).mock.calls[0];
    expect(content.text).toContain(`Tu reserva ${LINK_MARK} esta lista.`);
    expect(content.text).toContain(`Check-in: ${LINK_MARK}\n`);
    expect(content.text).toContain('Reserva QK7T2M');
    expect(content.text).not.toContain('http');
  });

  it('is cut to length after its addresses are taken out, not before', async () => {
    const link = `<https://click.example.com/${'a'.repeat(990)}>`;
    const message = forwarded([OWN_PASS], [], `${`${link}\r\n`.repeat(70)}Reserva QK7T2M`);
    await handle(message);
    const [, content] = vi.mocked(extractBookings).mock.calls[0];
    expect(content.text).toContain('Reserva QK7T2M');
  });
});

describe('an email delivered twice', () => {
  it('is answered without being read again', async () => {
    vi.mocked(alreadyStaged).mockResolvedValue(true);
    const message = forwarded([OWN_PASS]);
    await handle(message);
    expect(alreadyStaged).toHaveBeenCalledWith(expect.anything(), '<one@example.com>');
    expect(extractBookings).not.toHaveBeenCalled();
    expect(replied(message)).toContain('ya lo hab');
  });

  it('is answered as staged before when the other delivery staged it first', async () => {
    vi.mocked(extractBookings).mockResolvedValueOnce({
      trip_title: 'Bariloche',
      problem: null,
      items: [
        {
          kind: 'lodging',
          title: 'Hotel Cormorán',
          on_date: '2026-09-12',
          at_time: null,
          ends_on: '2026-09-19',
          ends_at: null,
          transport: null,
          origin: null,
          destination: null,
          comments: null,
          boarding_pass_files: [],
          files: [],
        },
      ],
    });
    vi.mocked(insertRows).mockRejectedValueOnce(new AlreadyStagedError());
    const message = forwarded([OWN_PASS]);
    await handle(message);
    expect(insertRows).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(Array),
      [],
      '<one@example.com>',
    );
    expect(replied(message)).toContain('ya lo hab');
    expect(replied(message)).not.toContain('falla del servicio');
  });
});

/** A forwarded email with these attachments, each a name, a declared type and
 *  raw bytes, after a short text part. */
function withAttachments(
  attachments: { name: string; type: string; bytes: Uint8Array; inline?: boolean }[],
) {
  const boundary = 'b0undary';
  const parts = attachments.map(
    (a) =>
      `--${boundary}\r\nContent-Type: ${a.type}; name="${a.name}"\r\nContent-Disposition: ${a.inline ? 'inline' : 'attachment'}; filename="${a.name}"\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(a.bytes).toString('base64')}\r\n`,
  );
  const raw = [
    `Authentication-Results: ${OWN_PASS}`,
    'From: Member <member@example.com>',
    'To: viajes@household.example',
    'Subject: Tu boarding pass',
    'Message-ID: <pass@example.com>',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    'Reenviado.',
    ...parts,
    `--${boundary}--`,
    '',
  ].join('\r\n');
  return {
    raw,
    from: 'member@example.com',
    to: 'viajes@household.example',
    headers: new Headers(),
    setReject: vi.fn(),
    reply: vi.fn(async () => {}),
  };
}

/** Bytes that open as a file of the given kind, padded to `size`. */
function fileBytes(magic: number[] | string, size: number): Uint8Array {
  const head = typeof magic === 'string' ? [...magic].map((c) => c.charCodeAt(0)) : magic;
  const bytes = new Uint8Array(size);
  bytes.set(head);
  return bytes;
}

/** Gives the household an inbox key for the next email, so its files are
 *  sealed and staged. */
async function withInboxKey(): Promise<void> {
  const pair = (await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['wrapKey', 'unwrapKey'],
  )) as CryptoKeyPair;
  const spki = Buffer.from(await crypto.subtle.exportKey('spki', pair.publicKey)).toString(
    'base64',
  );
  vi.mocked(inboxPublicKey).mockResolvedValueOnce(spki);
}

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff, 0xe0];

describe('the files an email brings', () => {
  it('keeps a picture as well as a PDF, as what its bytes say it is, and passes a tiny one over', async () => {
    const message = withAttachments([
      { name: 'pass.pdf', type: 'application/pdf', bytes: fileBytes('%PDF-1.4', 40_000) },
      { name: 'pass.png', type: 'image/png', bytes: fileBytes(PNG, 40_000) },
      // Named a PNG, is a JPEG: kept as what it is.
      { name: 'shot.png', type: 'application/octet-stream', bytes: fileBytes(JPEG, 40_000) },
      // The mail's logo: not a file anyone meant.
      { name: 'logo.png', type: 'image/png', bytes: fileBytes(PNG, 2_000), inline: true },
      // Claims to be a PDF and opens as nothing: left out, and counted.
      { name: 'x.pdf', type: 'application/pdf', bytes: fileBytes('hello', 40_000) },
    ]);
    await handle(message);
    const [, content] = vi.mocked(extractBookings).mock.calls[0];
    expect(content.files.map((file) => [file.name, file.mime])).toEqual([
      ['pass', 'application/pdf'],
      ['pass', 'image/png'],
      ['shot', 'image/jpeg'],
    ]);
    // Nothing found: the reply says so, and how many attachments were not files.
    expect(replied(message)).toContain('no guard');
  });

  it('refuses an email that is bookings and a boarding pass at once, with advice of its own', async () => {
    vi.mocked(extractBookings).mockResolvedValueOnce({
      trip_title: 'Bariloche',
      problem: null,
      items: [
        {
          kind: 'lodging',
          title: 'Hotel Cormorán',
          on_date: '2026-09-12',
          at_time: null,
          ends_on: '2026-09-19',
          ends_at: null,
          transport: null,
          origin: null,
          destination: null,
          comments: null,
          boarding_pass_files: [],
          files: [],
        },
        {
          kind: 'boarding_pass',
          title: 'AR 1420',
          on_date: '2026-09-12',
          at_time: '08:40',
          ends_on: null,
          ends_at: null,
          transport: 'flight',
          origin: 'AEP',
          destination: 'BRC',
          comments: null,
          boarding_pass_files: [],
          files: [1],
        },
      ],
    });
    const message = withAttachments([
      { name: 'pass.pdf', type: 'application/pdf', bytes: fileBytes('%PDF-1.4', 40_000) },
    ]);
    await handle(message);
    expect(insertRows).not.toHaveBeenCalled();
    expect(replied(message)).toContain('mezcla reservas y boarding pass');
    expect(replied(message)).toContain('por separado');
  });

  it('stages a boarding pass with its files and what they are', async () => {
    vi.mocked(extractBookings).mockResolvedValueOnce({
      trip_title: 'Bariloche',
      problem: null,
      items: [
        {
          kind: 'boarding_pass',
          title: 'AR 1420',
          on_date: '2026-09-12',
          at_time: '08:40',
          ends_on: null,
          ends_at: null,
          transport: 'flight',
          origin: 'AEP',
          destination: 'BRC',
          comments: 'Ana 14A',
          boarding_pass_files: [{ file: 1, pages: [] }],
          files: [],
        },
      ],
    });
    await withInboxKey();
    const message = withAttachments([
      { name: 'pass.png', type: 'image/png', bytes: fileBytes(PNG, 40_000) },
    ]);
    await handle(message);
    const [, , rows, files] = vi.mocked(insertRows).mock.calls[0];
    expect(rows).toMatchObject([{ kind: 'boarding_pass', title: 'AR 1420' }]);
    expect(files).toMatchObject([{ name: 'pass', mime: 'image/png', size: 40_000 }]);
    expect(rows[0].boarding_pass_file_ids).toEqual([files[0].id]);
    expect(rows[0].file_ids).toEqual([]);
    expect(replied(message)).toContain('un boarding pass, con 1 archivo');
  });

  it('stages each leg of a connection with its own page of the one PDF, and not the whole', async () => {
    const leg = (title: string, page: number) => ({
      kind: 'boarding_pass' as const,
      title,
      on_date: '2026-09-12',
      at_time: null,
      ends_on: null,
      ends_at: null,
      transport: 'flight' as const,
      origin: null,
      destination: null,
      comments: null,
      boarding_pass_files: [{ file: 1, pages: [page] }],
      files: [],
    });
    vi.mocked(extractBookings).mockResolvedValueOnce({
      trip_title: 'Bariloche',
      problem: null,
      items: [leg('AR 1502', 1), leg('AR 1564', 2)],
    });
    await withInboxKey();
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.addPage();
    const message = withAttachments([
      { name: 'pases.pdf', type: 'application/pdf', bytes: await doc.save() },
    ]);
    await handle(message);
    const [, , rows, files] = vi.mocked(insertRows).mock.calls[0];
    expect(files).toHaveLength(2);
    expect(rows.map((row) => row.boarding_pass_file_ids)).toEqual(files.map((file) => [file.id]));
  });
});
