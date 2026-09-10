import { describe, it, expect, vi, afterEach } from 'vitest';
import { NO_ANSWER, fetchWithin, gotNoAnswer } from './fetchWithin';

/** A fetch that answers only when its signal is pulled. */
function neverAnswers() {
  return vi.fn(
    (_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason as Error));
      }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('fetchWithin', () => {
  it('hands back an answer that comes in time, and lets go of the bound', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('ok'))),
    );
    const response = await fetchWithin(1000, 'https://example.test/');
    expect(await response.text()).toBe('ok');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('gives up a request that gets no answer within the bound', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', neverAnswers());
    const outcome = fetchWithin(1000, 'https://example.test/').then(
      () => 'answered',
      (err: unknown) => err,
    );
    await vi.advanceTimersByTimeAsync(999);
    await vi.advanceTimersByTimeAsync(1);
    const err = await outcome;
    expect(gotNoAnswer(err)).toBe(true);
    // The name the Supabase client hands back as it is, rather than retrying.
    expect((err as DOMException).name).toBe('AbortError');
  });

  it("keeps the caller's own signal, and tells its abort from the bound's", async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', neverAnswers());
    const caller = new AbortController();
    const outcome = fetchWithin(1000, 'https://example.test/', { signal: caller.signal }).then(
      () => 'answered',
      (err: unknown) => err,
    );
    caller.abort(new Error('the page moved on'));
    const err = await outcome;
    expect(gotNoAnswer(err)).toBe(false);
    expect((err as Error).message).toBe('the page moved on');
  });
});

describe('gotNoAnswer', () => {
  it('knows its own failure as the Supabase client reports it', () => {
    expect(
      gotNoAnswer({ message: `AbortError: ${NO_ANSWER}`, details: '', hint: '', code: '' }),
    ).toBe(true);
  });

  it('takes nothing else for it', () => {
    expect(gotNoAnswer(new TypeError('Failed to fetch'))).toBe(false);
    expect(
      gotNoAnswer({ message: 'new row violates row-level security policy', code: '42501' }),
    ).toBe(false);
    expect(gotNoAnswer(null)).toBe(false);
    expect(gotNoAnswer('no answer')).toBe(false);
  });
});
