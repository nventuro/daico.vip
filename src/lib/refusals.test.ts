import { describe, it, expect } from 'vitest';
import { isPermanentRowError, isPermanentStatus } from './refusals';

describe('isPermanentStatus', () => {
  it('is true for what the server says about the request itself', () => {
    for (const status of [400, 404, 409, 413, 415, 422, 499]) {
      expect(isPermanentStatus(status)).toBe(true);
    }
  });

  it('is false for what belongs to the moment', () => {
    // No session, forbidden, timed out, throttled: all pass once it changes.
    for (const status of [401, 403, 408, 429]) expect(isPermanentStatus(status)).toBe(false);
    // The server's own trouble, and an answer that never arrived.
    for (const status of [500, 502, 503, 504, undefined]) {
      expect(isPermanentStatus(status)).toBe(false);
    }
  });

  it('is false below the client errors', () => {
    for (const status of [200, 204, 302, 399]) expect(isPermanentStatus(status)).toBe(false);
  });
});

describe('isPermanentRowError', () => {
  it('is true for a value, a constraint or a permission the row will never satisfy', () => {
    for (const code of ['22001', '23505', '23503', '42501', '42703']) {
      expect(isPermanentRowError({ code })).toBe(true);
    }
  });

  it('is false for anything that may pass later, and for no code at all', () => {
    for (const code of ['08006', '53300', '57014', 'PGRST301']) {
      expect(isPermanentRowError({ code })).toBe(false);
    }
    expect(isPermanentRowError({})).toBe(false);
    expect(isPermanentRowError(null)).toBe(false);
  });
});
