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
  insertRows: vi.fn(async () => {}),
}));
vi.mock('./extract', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./extract')>()),
  extractBookings: vi.fn(async () => null),
}));

const { default: worker } = await import('./index');
const { extractBookings } = await import('./extract');

const ENV: Env = {
  ANTHROPIC_API_KEY: 'key',
  HYPERDRIVE: { connectionString: 'postgres://db' } as Hyperdrive,
};

/** A forwarded email as the platform hands it over, with the given
 *  Authentication-Results headers in the given order, the first on top. */
function forwarded(verdicts: string[]) {
  const headers = verdicts.map((verdict) => `Authentication-Results: ${verdict}`);
  const raw = [
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

const OWN_PASS = `${RECEIVING_SERVER}; dmarc=pass header.from=example.com`;
const OWN_FAIL = `${RECEIVING_SERVER}; dmarc=fail header.from=example.com`;

beforeEach(() => {
  vi.mocked(extractBookings).mockClear();
});

describe('the gate on a forwarded email', () => {
  it("reads the first verdict only: a pass the message carried under the server's fail is turned away", async () => {
    const message = forwarded([OWN_FAIL, OWN_PASS]);
    await handle(message);
    expect(message.setReject).toHaveBeenCalledWith('address not accepted');
    expect(message.reply).not.toHaveBeenCalled();
    expect(extractBookings).not.toHaveBeenCalled();
  });

  it('turns away a verdict headed by anyone but the receiving server', async () => {
    const message = forwarded(['mx.example.net; dmarc=pass header.from=example.com']);
    await handle(message);
    expect(message.setReject).toHaveBeenCalled();
    expect(extractBookings).not.toHaveBeenCalled();
  });

  it("lets a member through on the server's own pass, whatever the message carried below it", async () => {
    const message = forwarded([OWN_PASS, 'mx.example.net; dmarc=fail header.from=example.com']);
    await handle(message);
    expect(message.setReject).not.toHaveBeenCalled();
    expect(extractBookings).toHaveBeenCalledTimes(1);
    expect(message.reply).toHaveBeenCalledTimes(1);
  });
});
