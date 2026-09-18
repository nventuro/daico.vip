import { describe, it, expect, vi } from 'vitest';
import { inParallel } from './parallel';

describe('inParallel', () => {
  it('works through every item with no more than the bound in hand at once', async () => {
    const items = Array.from({ length: 10 }, (_, index) => index);
    let inHand = 0;
    let most = 0;
    const worked: number[] = [];
    await inParallel(items, 3, async (item) => {
      inHand += 1;
      most = Math.max(most, inHand);
      await Promise.resolve();
      inHand -= 1;
      worked.push(item);
    });

    expect(most).toBe(3);
    expect([...worked].sort((a, b) => a - b)).toEqual(items);
  });

  it('takes the items in the order given', async () => {
    const taken: number[] = [];
    await inParallel([0, 1, 2, 3, 4], 2, async (item) => {
      taken.push(item);
      await Promise.resolve();
    });

    expect(taken).toEqual([0, 1, 2, 3, 4]);
  });

  it('takes up no more once one fails, and throws it with those in hand through', async () => {
    const taken: number[] = [];
    const worked: number[] = [];
    const run = inParallel([0, 1, 2, 3, 4, 5], 2, async (item) => {
      taken.push(item);
      await Promise.resolve();
      if (item === 0) throw new Error('nope');
      worked.push(item);
    });

    await expect(run).rejects.toThrow('nope');
    expect(taken).toEqual([0, 1]);
    expect(worked).toEqual([1]);
  });

  it('does nothing with nothing to do', async () => {
    const work = vi.fn(() => Promise.resolve());
    await inParallel([], 3, work);
    expect(work).not.toHaveBeenCalled();
  });
});
