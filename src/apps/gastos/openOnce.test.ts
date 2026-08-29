import { describe, it, expect, vi } from 'vitest';
import { openOnce } from './openOnce';

const row = (id: string, updated_at: string) => ({ id, created_at: '', updated_at });

describe('openOnce', () => {
  it('opens one version of a row once, however many readers ask', async () => {
    const open = vi.fn().mockResolvedValue('contents');
    const statement = row('a', '2026-08-27T10:00:00.000Z');
    expect(await openOnce(statement, open)).toBe('contents');
    expect(await openOnce(statement, open)).toBe('contents');
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('opens it again once the row has been written', async () => {
    const open = vi.fn().mockResolvedValue('contents');
    await openOnce(row('b', '2026-08-27T10:00:00.000Z'), open);
    await openOnce(row('b', '2026-08-28T10:00:00.000Z'), open);
    expect(open).toHaveBeenCalledTimes(2);
  });

  it('keeps no failure: the next reader tries again', async () => {
    const open = vi.fn().mockRejectedValueOnce(new Error('no key')).mockResolvedValue('contents');
    const statement = row('c', '2026-08-27T10:00:00.000Z');
    await expect(openOnce(statement, open)).rejects.toThrow('no key');
    expect(await openOnce(statement, open)).toBe('contents');
    expect(open).toHaveBeenCalledTimes(2);
  });
});
