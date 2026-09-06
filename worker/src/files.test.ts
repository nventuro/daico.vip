import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APP_ORIGIN, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../src/config';
import worker, { OBJECT_MAX_BYTES, OBJECT_MIN_BYTES, OBJECT_TYPE, type Env } from './files';

/** The bucket, in memory: what the worker's binding does. */
class FakeBucket {
  readonly objects = new Map<string, { data: Uint8Array; uploaded: Date }>();
  failing = false;

  private check(): void {
    if (this.failing) throw new Error('bucket down');
  }

  async get(key: string) {
    this.check();
    const object = this.objects.get(key);
    if (!object) return null;
    return {
      key,
      size: object.data.byteLength,
      uploaded: object.uploaded,
      body: new Blob([object.data]).stream(),
    };
  }

  async put(key: string, value: ArrayBuffer) {
    this.check();
    this.objects.set(key, { data: new Uint8Array(value), uploaded: new Date() });
  }

  async delete(key: string) {
    this.check();
    this.objects.delete(key);
  }

  async list({ limit, cursor }: { limit: number; cursor?: string }) {
    this.check();
    const all = [...this.objects.entries()];
    const start = cursor === undefined ? 0 : Number(cursor);
    const next = start + limit;
    const objects = all
      .slice(start, next)
      .map(([key, { data, uploaded }]) => ({ key, size: data.byteLength, uploaded }));
    return next < all.length
      ? { objects, truncated: true, cursor: String(next) }
      : { objects, truncated: false };
  }
}

const ID = '3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const OTHER = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const BYTES = new Uint8Array(OBJECT_MIN_BYTES).fill(7);

/** What the database answers the membership question with. */
const database = { status: 200, count: 1 };
const asked: Request[] = [];

let bucket: FakeBucket;
let env: Env;

/** A request as the app makes one: from its origin, carrying the token. */
function call(
  method: string,
  path = `/${ID}`,
  init: {
    token?: string | null;
    origin?: string | null;
    body?: BodyInit;
    headers?: Record<string, string>;
  } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = init.token === undefined ? 'a-token' : init.token;
  if (token !== null) headers.set('Authorization', `Bearer ${token}`);
  const origin = init.origin === undefined ? APP_ORIGIN : init.origin;
  if (origin !== null) headers.set('Origin', origin);
  const request = new Request(`https://files.daico.vip${path}`, {
    method,
    headers,
    body: init.body,
  });
  return worker.fetch(request as unknown as Parameters<typeof worker.fetch>[0], env);
}

/** A sealed blob sent as the app sends one. */
function put(id = ID, body: BodyInit = BYTES, type = OBJECT_TYPE): Promise<Response> {
  return call('PUT', `/${id}`, { body, headers: { 'Content-Type': type } });
}

beforeEach(() => {
  bucket = new FakeBucket();
  env = { ATTACHMENTS: bucket as unknown as R2Bucket };
  database.status = 200;
  database.count = 1;
  asked.length = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      asked.push(new Request(input, init));
      const headers: Record<string, string> = {};
      if (database.status === 200) {
        headers['Content-Range'] = database.count > 0 ? `0-0/${database.count}` : '*/0';
      }
      return new Response(null, { status: database.status, headers });
    }),
  );
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('the gate', () => {
  it("answers a preflight for the app's origin, and for no other", async () => {
    const ours = await call('OPTIONS', `/${ID}`, { token: null });
    expect(ours.status).toBe(204);
    expect(ours.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN);
    expect(ours.headers.get('Access-Control-Allow-Methods')).toBe('GET, PUT, DELETE');
    expect(ours.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');

    const theirs = await call('OPTIONS', `/${ID}`, { token: null, origin: 'https://example.com' });
    expect(theirs.status).toBe(204);
    expect(theirs.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(asked).toHaveLength(0);
  });

  it('turns away a request with no token before asking anyone', async () => {
    expect((await call('GET', `/${ID}`, { token: null })).status).toBe(401);
    expect(
      (await call('GET', `/${ID}`, { headers: { Authorization: 'Basic x' }, token: null })).status,
    ).toBe(401);
    expect(asked).toHaveLength(0);
  });

  it("asks the database with the caller's own token, for a count and nothing else", async () => {
    await call('GET');
    expect(asked).toHaveLength(1);
    const [request] = asked;
    expect(request.method).toBe('HEAD');
    expect(request.url).toBe(`${SUPABASE_URL}/rest/v1/members?select=email`);
    expect(request.headers.get('apikey')).toBe(SUPABASE_PUBLISHABLE_KEY);
    expect(request.headers.get('Authorization')).toBe('Bearer a-token');
    expect(request.headers.get('Prefer')).toBe('count=exact');
  });

  it('refuses a token the database refuses, a caller who is not a member, and waits when it cannot say', async () => {
    database.status = 401;
    expect((await call('GET')).status).toBe(401);
    database.status = 200;
    database.count = 0;
    expect((await call('GET')).status).toBe(403);
    database.status = 500;
    expect((await call('GET')).status).toBe(503);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('unreachable'))),
    );
    expect((await call('GET')).status).toBe(503);
  });

  it('names an object by a UUID and nothing else, without asking', async () => {
    expect((await call('GET', '/not-an-id')).status).toBe(404);
    expect((await call('GET', `/${ID.toUpperCase()}`)).status).toBe(404);
    expect((await call('PUT', '/../etc', { body: BYTES })).status).toBe(404);
    expect((await call('GET', `/${ID}/more`)).status).toBe(404);
    expect(asked).toHaveLength(0);
  });

  it('allows only what is done to a file, and to the listing', async () => {
    const post = await call('POST');
    expect(post.status).toBe(405);
    expect(post.headers.get('Allow')).toBe('GET, PUT, DELETE');
    expect((await call('PUT', '/', { body: BYTES })).status).toBe(405);
    expect((await call('DELETE', '/')).status).toBe(405);
    expect(asked).toHaveLength(0);
  });

  it('marks every answer as not to be cached, and readable from the app', async () => {
    await put();
    for (const response of [
      await call('GET'),
      await call('GET', '/'),
      await call('GET', `/${OTHER}`),
    ]) {
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN);
    }
  });
});

describe('the bucket', () => {
  it('keeps a sealed blob under its id and hands it back as it came', async () => {
    expect((await put()).status).toBe(204);
    const response = await call('GET');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(OBJECT_TYPE);
    expect(response.headers.get('Content-Length')).toBe(String(BYTES.byteLength));
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(BYTES);
    expect((await call('GET', `/${OTHER}`)).status).toBe(404);
  });

  it('writes an id the bucket has again, so a lost answer costs nothing', async () => {
    await put();
    expect((await put()).status).toBe(204);
    expect(bucket.objects.size).toBe(1);
  });

  it('refuses what is not an opaque blob, what is too large, and what is shorter than a seal', async () => {
    expect((await put(ID, BYTES, 'image/png')).status).toBe(415);
    expect(
      (
        await call('PUT', `/${ID}`, {
          body: BYTES,
          headers: { 'Content-Type': OBJECT_TYPE, 'Content-Length': String(OBJECT_MAX_BYTES + 1) },
        })
      ).status,
    ).toBe(413);
    expect((await put(ID, new Uint8Array(OBJECT_MAX_BYTES + 1))).status).toBe(413);
    expect((await put(ID, new Uint8Array(OBJECT_MIN_BYTES - 1))).status).toBe(400);
    expect(bucket.objects.size).toBe(0);
    expect((await put(ID, new Uint8Array(OBJECT_MAX_BYTES))).status).toBe(204);
  });

  it('removes an object, and one that is already gone', async () => {
    await put();
    expect((await call('DELETE')).status).toBe(204);
    expect((await call('GET')).status).toBe(404);
    expect((await call('DELETE')).status).toBe(204);
  });

  it('lists every object with when it went up, a page at a time', async () => {
    const uploaded = new Date('2026-09-06T10:00:00.000Z');
    for (let i = 0; i < 1001; i++) {
      bucket.objects.set(`object-${i}`, { data: BYTES, uploaded });
    }
    const first = await call('GET', '/');
    expect(first.status).toBe(200);
    expect(first.headers.get('Content-Type')).toBe('application/json');
    const page = (await first.json()) as { objects: unknown[]; cursor: string | null };
    expect(page.objects).toHaveLength(1000);
    expect(page.objects[0]).toEqual({ name: 'object-0', uploaded: uploaded.toISOString() });
    expect(page.cursor).not.toBeNull();

    const second = await call('GET', `/?cursor=${page.cursor}`);
    const rest = (await second.json()) as { objects: unknown[]; cursor: string | null };
    expect(rest.objects).toEqual([{ name: 'object-1000', uploaded: uploaded.toISOString() }]);
    expect(rest.cursor).toBeNull();
  });

  it('answers a bucket that fails with a failure that may pass later', async () => {
    bucket.failing = true;
    expect((await call('GET')).status).toBe(500);
    expect((await put()).status).toBe(500);
    expect((await call('GET', '/')).status).toBe(500);
  });
});
