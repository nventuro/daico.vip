import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OPENED_MAX_BYTES, forgetOpened, openOnce, openRowOnce } from './opened';

beforeEach(() => forgetOpened());

const row = (id: string, updatedAt: string) => ({
  id,
  created_at: updatedAt,
  updated_at: updatedAt,
});

describe('openRowOnce', () => {
  it('opens a row once per version of it', async () => {
    const open = vi.fn(() => Promise.resolve('contents'));
    const statement = row('a', '2026-08-27T10:00:00.000Z');
    expect(await openRowOnce('statements', statement, open)).toBe('contents');
    expect(await openRowOnce('statements', statement, open)).toBe('contents');
    expect(open).toHaveBeenCalledTimes(1);
    await openRowOnce('statements', row('a', '2026-08-28T10:00:00.000Z'), open);
    expect(open).toHaveBeenCalledTimes(2);
  });

  it('keeps a row of one table apart from the same id in another', async () => {
    const open = vi.fn(() => Promise.resolve('x'));
    const same = row('a', '2026-08-27T10:00:00.000Z');
    await openRowOnce('statements', same, open);
    await openRowOnce('merchant_rules', same, open);
    expect(open).toHaveBeenCalledTimes(2);
  });
});

describe('openOnce', () => {
  it('lets go of the files opened longest ago once they weigh too much together', async () => {
    const open = vi.fn(() => Promise.resolve('x'));
    const big = OPENED_MAX_BYTES / 2;
    await openOnce('attachments:a', 'k', open, big);
    await openOnce('attachments:b', 'k', open, big);
    // Reading a again makes it the most recent; c then pushes b out.
    await openOnce('attachments:a', 'k', open, big);
    await openOnce('attachments:c', 'k', open, big);
    expect(open).toHaveBeenCalledTimes(3);
    await openOnce('attachments:a', 'k', open, big);
    expect(open).toHaveBeenCalledTimes(3);
    await openOnce('attachments:b', 'k', open, big);
    expect(open).toHaveBeenCalledTimes(4);
  });

  it('keeps what has no weight through it all', async () => {
    const open = vi.fn(() => Promise.resolve('x'));
    await openOnce('statements:s', 'k', open);
    await openOnce('attachments:a', 'k', open, OPENED_MAX_BYTES);
    await openOnce('attachments:b', 'k', open, OPENED_MAX_BYTES);
    await openOnce('statements:s', 'k', open);
    expect(open).toHaveBeenCalledTimes(3);
  });

  it('keeps no failure, so the next reader tries again', async () => {
    const open = vi.fn().mockRejectedValueOnce(new Error('no key')).mockResolvedValue('contents');
    await expect(openOnce('attachments:a', 'k', open)).rejects.toThrow('no key');
    expect(await openOnce('attachments:a', 'k', open)).toBe('contents');
  });

  it('forgets everything when told to', async () => {
    const open = vi.fn(() => Promise.resolve('x'));
    await openOnce('attachments:b', 'k', open);
    forgetOpened();
    await openOnce('attachments:b', 'k', open);
    expect(open).toHaveBeenCalledTimes(2);
  });
});
