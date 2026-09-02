import { describe, it, expect } from 'vitest';
import { isAllowedSender, senderRejection, type Sender } from './gate';

const MEMBERS = ['Member@Example.com', 'other@example.com'];
const PASSING =
  'mx.example.net; dkim=pass header.d=example.com; spf=pass; dmarc=pass header.from=example.com';

function sender(overrides: Partial<Sender> = {}): Sender {
  return {
    envelopeFrom: 'member@example.com',
    headerFrom: 'member@example.com',
    authenticationResults: PASSING,
    ...overrides,
  };
}

describe('senderRejection', () => {
  it('lets a member through whose mail passed DMARC', () => {
    expect(senderRejection(sender(), MEMBERS)).toBeNull();
    expect(isAllowedSender(sender(), MEMBERS)).toBe(true);
  });

  it('reads addresses case-insensitively, on both sides', () => {
    const s = sender({ envelopeFrom: 'MEMBER@example.com', headerFrom: 'Member@EXAMPLE.com' });
    expect(senderRejection(s, ['member@example.com'])).toBeNull();
  });

  it('turns away a forged From header, whatever the envelope says', () => {
    const s = sender({
      envelopeFrom: 'member@example.com',
      headerFrom: 'stranger@elsewhere.example',
    });
    expect(senderRejection(s, MEMBERS)).toBe('from-not-member');
    expect(senderRejection(sender({ headerFrom: null }), MEMBERS)).toBe('from-not-member');
  });

  it('turns away a member From header on a stranger envelope: the reply would go to the stranger', () => {
    const s = sender({ envelopeFrom: 'stranger@elsewhere.example' });
    expect(senderRejection(s, MEMBERS)).toBe('envelope-not-member');
  });

  it('needs a verdict, and needs it to be a DMARC pass', () => {
    expect(senderRejection(sender({ authenticationResults: null }), MEMBERS)).toBe('no-verdict');
    const failed =
      'mx.example.net; dkim=pass header.d=elsewhere.example; dmarc=fail header.from=example.com';
    expect(senderRejection(sender({ authenticationResults: failed }), MEMBERS)).toBe(
      'dmarc-failed',
    );
    // A signature alone is not an alignment: dkim=pass without dmarc=pass.
    const signedOnly = 'mx.example.net; dkim=pass header.d=elsewhere.example; spf=none';
    expect(senderRejection(sender({ authenticationResults: signedOnly }), MEMBERS)).toBe(
      'dmarc-failed',
    );
    // Nor is a word that only contains it.
    const lookalike = 'mx.example.net; xdmarc=pass; dmarc=passive';
    expect(senderRejection(sender({ authenticationResults: lookalike }), MEMBERS)).toBe(
      'dmarc-failed',
    );
  });

  it('takes the verdict however it is spaced or cased', () => {
    const s = sender({
      authenticationResults: 'mx.example.net;\r\n\tDMARC=PASS (p=none) header.from=example.com',
    });
    expect(senderRejection(s, MEMBERS)).toBeNull();
  });
});
