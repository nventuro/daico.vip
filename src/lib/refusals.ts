// =============================================================================
// Telling a refusal that can never pass from one that may. What the server
// says about the request itself — a file too large for the bucket, a row that
// breaks a constraint, something this session may not do — is final: retrying
// changes nothing, so the work moves on and leaves it where it is. No session,
// throttling, the server down or the network gone belong to the moment, and
// everything waits for the next run.
// =============================================================================

/** Client-error statuses that are about the moment after all. */
const RETRIED_STATUSES = [401, 403, 408, 429];

/** Whether a call that got as far as the server was refused for good, by the
 *  HTTP status it came back with. An answer that never arrived (no status) may
 *  arrive next time. */
export function isPermanentStatus(status: number | undefined): boolean {
  return (
    status !== undefined && status >= 400 && status < 500 && !RETRIED_STATUSES.includes(status)
  );
}

// SQLSTATE classes describing what was asked rather than the moment: 22 a value
// the column cannot hold, 23 a constraint it breaks, 42 something this session
// may not do or a column that is not there.
const PERMANENT_SQLSTATE_CLASSES = ['22', '23', '42'];

/** Whether the server refused this row for good, by the code PostgREST
 *  reports. Anything else — a lost connection, an expired token, the server
 *  down — is the moment's. */
export function isPermanentRowError(error: { code?: string } | null): boolean {
  const code = error?.code;
  return code !== undefined && PERMANENT_SQLSTATE_CLASSES.includes(code.slice(0, 2));
}
