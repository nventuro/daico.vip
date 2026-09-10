// =============================================================================
// A fetch that gives up when the server has not answered in time. A request
// over a link the device believes it has — no signal, but not offline either
// — is kept open by the browser until its own transport gives up, minutes
// later, and nothing that waits on it moves meanwhile. Here it fails after a
// bound instead, and the failure reads as a request that got no answer, which
// everything that retries already takes as the moment's and tries again later.
//
// What is bounded is the answer, not the transfer: once the server's headers
// are in, the body streams for as long as it takes. A request whose answer
// only comes after its body is sent — an upload — has to be given a bound
// that grows with the body.
// =============================================================================

/** How long a request may go unanswered before it is given up: the server's
 *  own limit on a query, plus what a link at the edge of signal adds before
 *  and after it — well short of the minutes a dead one would cost. */
export const REQUEST_TIMEOUT_MS = 15_000;

/** What the failure says. The one text a request that got no answer carries,
 *  as thrown and inside whatever the Supabase client wraps it in. */
export const NO_ANSWER = 'no answer from the server in time';

/**
 * `fetch(input, init)`, failed after `ms` without the server's headers. The
 * failure is an `AbortError`, which the Supabase client hands back as it is
 * — never as a refusal, never retried — so a queued row stays queued.
 */
export function fetchWithin(
  ms: number,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException(NO_ANSWER, 'AbortError')), ms);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, controller.signal])
    : controller.signal;
  return fetch(input, { ...init, signal }).finally(() => clearTimeout(timer));
}

/** Whether `error` is a request that got no answer in time — as thrown, or
 *  as the Supabase client reports it, its text kept in the message. */
export function gotNoAnswer(error: unknown): boolean {
  if (error === null || typeof error !== 'object' || !('message' in error)) return false;
  return String(error.message).includes(NO_ANSWER);
}
