import { describe, it, expect, vi, beforeEach } from 'vitest';
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
const { extractBookings } = await import('./extract');
const { openDb, alreadyStaged, insertRows, AlreadyStagedError } = await import('./db');

const ENV: Env = {
  ANTHROPIC_API_KEY: 'key',
  HYPERDRIVE: { connectionString: 'postgres://db' } as Hyperdrive,
};

/** A forwarded email as the platform hands it over, with the given
 *  Authentication-Results headers in the given order, the first on top,
 *  and any other headers after them. */
function forwarded(verdicts: string[], headers: string[] = []) {
  const raw = [
    ...verdicts.map((verdict) => `Authentication-Results: ${verdict}`),
    ...headers,
    'From: Member <member@example.com>',
    'To: viajes@household.example',
    'Subject: Reserva',
    'Message-ID: <one@example.com>',
    'Content-Type: text/plain; charset=utf-8',
    '',
    'Reenviado.',
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
          from_code: null,
          to_code: null,
          comments: null,
          pdfs: [],
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
