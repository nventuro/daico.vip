// =============================================================================
// The files worker: the one way to the bucket the attachment files live in.
// A member's device sends a file up, fetches one down, lists what the bucket
// holds and removes what no row refers to, each as one request carrying the
// token the app got at sign-in. The bucket knows nothing of members, so
// before touching it the worker asks the database's own API, with that very
// token, how many rows of `members` the caller may see: the same
// `private.is_member()` that gates every table decides here too, and the
// worker learns nothing but the count. What it moves is ciphertext either way.
//
// What the worker holds: the bucket binding, and nothing else — no secret and
// no database. The bucket has no address of its own, no public development
// URL and no domain, so this worker is the only way in, and it only ever
// takes an opaque blob the size of a sealed attachment, under an id that is
// a UUID.
//
// Deployed on its own, beside the email worker, with the `files:*` scripts.
//
// Nothing of a file is ever logged: an id is a row's and the bytes are
// sealed, but a log is still a place neither needs to be.
// =============================================================================
import { APP_ORIGIN, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../src/config';

export interface Env {
  ATTACHMENTS: R2Bucket;
}

/** The largest file the app attaches. */
const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
/** What sealing a file adds to it: a format byte, the nonce and the tag. */
const SEAL_OVERHEAD_BYTES = 29;
/** The smallest and largest object taken: a sealed file is never shorter than
 *  its seal around one byte, nor longer than the largest file sealed. */
export const OBJECT_MIN_BYTES = SEAL_OVERHEAD_BYTES + 1;
export const OBJECT_MAX_BYTES = ATTACHMENT_MAX_BYTES + SEAL_OVERHEAD_BYTES;
/** The one type an object is taken as: the real type lives in the row. */
export const OBJECT_TYPE = 'application/octet-stream';
/** Objects listed per page: as many as the bucket gives at once. */
const LIST_PAGE = 1000;
/** The shape of an id, lower-case as the app writes one; nothing else names
 *  an object. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** The origins a browser may call from: the app, and the app served locally
 *  by the dev server and by the preview. */
const ALLOWED_ORIGINS = [APP_ORIGIN, 'http://localhost:5173', 'http://localhost:4173'];
/** How long a browser may keep a preflight's answer. */
const PREFLIGHT_MAX_AGE_SECONDS = 24 * 60 * 60;

/** What the database says of the caller: a member or not, `refused` when the
 *  token is no good, `unavailable` when it could not say. */
export type Membership = 'member' | 'not-member' | 'refused' | 'unavailable';

/**
 * Ask the database how many members the caller may see, with the caller's own
 * token: a member sees them all, anyone else none. A `HEAD` with a count, so
 * the answer is a number in a header and never a row.
 */
export async function membership(authorization: string | null): Promise<Membership> {
  if (!authorization?.startsWith('Bearer ')) return 'refused';
  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/rest/v1/members?select=email`, {
      method: 'HEAD',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: authorization,
        Prefer: 'count=exact',
      },
    });
  } catch {
    return 'unavailable';
  }
  if (response.status === 401) return 'refused';
  if (!response.ok) return 'unavailable';
  const count = /\/(\d+)$/.exec(response.headers.get('Content-Range') ?? '');
  if (!count) return 'unavailable';
  return Number(count[1]) > 0 ? 'member' : 'not-member';
}

/** The headers that let a browser on an allowed origin read the answer; none
 *  for any other origin, which its browser then keeps from the page. */
function corsHeaders(origin: string | null): Record<string, string> {
  if (origin === null || !ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': String(PREFLIGHT_MAX_AGE_SECONDS),
    Vary: 'Origin',
  };
}

/** What the worker answers a listing with: each object's id and when it went
 *  up, and where the next page starts, or null on the last. */
interface ObjectsPage {
  objects: { name: string; uploaded: string }[];
  cursor: string | null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default {
  async fetch(request, env): Promise<Response> {
    const cors = corsHeaders(request.headers.get('Origin'));
    // Never cached by a browser: a file is kept by the app itself, and a
    // listing is only ever true at the moment it is made.
    const answer = (status: number, body: BodyInit | null = null, headers = {}) =>
      new Response(body, { status, headers: { ...cors, 'Cache-Control': 'no-store', ...headers } });
    if (request.method === 'OPTIONS') return answer(204);

    const url = new URL(request.url);
    const id = url.pathname.slice(1);
    const listing = id === '';
    if (!listing && !UUID.test(id)) return answer(404);
    const allowed = listing ? ['GET'] : ['GET', 'PUT', 'DELETE'];
    if (!allowed.includes(request.method)) return answer(405, null, { Allow: allowed.join(', ') });

    // The gate, before the bucket is touched: a caller who is not a member
    // learns nothing, not even whether an id exists.
    const verdict = await membership(request.headers.get('Authorization'));
    if (verdict === 'refused') return answer(401);
    if (verdict === 'not-member') return answer(403);
    if (verdict === 'unavailable') return answer(503);

    try {
      if (listing) {
        const page = await env.ATTACHMENTS.list({
          limit: LIST_PAGE,
          cursor: url.searchParams.get('cursor') ?? undefined,
        });
        const body: ObjectsPage = {
          objects: page.objects.map((o) => ({ name: o.key, uploaded: o.uploaded.toISOString() })),
          cursor: page.truncated ? page.cursor : null,
        };
        return answer(200, JSON.stringify(body), { 'Content-Type': 'application/json' });
      }
      if (request.method === 'PUT') {
        if (request.headers.get('Content-Type') !== OBJECT_TYPE) return answer(415);
        // Refused by what it says of itself before a byte is read, and by
        // what it turns out to be after.
        const declared = request.headers.get('Content-Length');
        if (declared !== null && Number(declared) > OBJECT_MAX_BYTES) return answer(413);
        const body = await request.arrayBuffer();
        if (body.byteLength > OBJECT_MAX_BYTES) return answer(413);
        if (body.byteLength < OBJECT_MIN_BYTES) return answer(400);
        await env.ATTACHMENTS.put(id, body, { httpMetadata: { contentType: OBJECT_TYPE } });
        return answer(204);
      }
      if (request.method === 'DELETE') {
        await env.ATTACHMENTS.delete(id);
        return answer(204);
      }
      const object = await env.ATTACHMENTS.get(id);
      if (object === null) return answer(404);
      return answer(200, object.body, {
        'Content-Type': OBJECT_TYPE,
        'Content-Length': String(object.size),
      });
    } catch (error) {
      console.error(`failed: ${errorMessage(error)}`);
      return answer(500);
    }
  },
} satisfies ExportedHandler<Env>;
