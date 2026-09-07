// =============================================================================
// A bucket on an S3-compatible service — the attachments in R2, the backups
// in B2 — reached path-style over a signed fetch: list, get and put, and no
// delete, which no key of the backup's holds anyway. Signature Version 4 is
// written out here rather than taken from the AWS SDK: three requests need
// nothing of its tree, and the nightly job runs with secrets in hand, where
// every dependency is a party to trust.
// =============================================================================
import { createHash, createHmac } from 'node:crypto';

const ALGORITHM = 'AWS4-HMAC-SHA256';
const SERVICE = 's3';
/** What one listing asks for: as many keys as the services give at once. */
const LIST_PAGE = 1000;
const OBJECT_TYPE = 'application/octet-stream';

const sha256Hex = (data) => createHash('sha256').update(data).digest('hex');
/** What a bucket under Object Lock asks of every upload. */
const md5Base64 = (data) => createHash('md5').update(data).digest('base64');
const hmac = (key, data) => createHmac('sha256', key).update(data).digest();

/** The region a signature names: R2 signs everything as `auto`, B2's is in
 *  its endpoint's host (`s3.us-west-004.backblazeb2.com`). */
export function regionOf(host) {
  if (host.endsWith('.r2.cloudflarestorage.com')) return 'auto';
  const b2 = /^s3\.([a-z0-9-]+)\.backblazeb2\.com$/.exec(host);
  return b2 ? b2[1] : 'us-east-1';
}

/** RFC 3986 encoding, which is what a signature and S3 agree on. */
const encode = (s) =>
  encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

/** `20260907T060000Z`: the instant as a signature writes it. */
const amzDate = (now) =>
  now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

/**
 * The headers of a request signed for `url`: the ones given, plus the date,
 * the payload's hash and the authorization the service checks. `payloadHash`
 * is the hex SHA-256 of the body, or of nothing for a request without one.
 */
export function sign({
  method,
  url,
  headers,
  payloadHash,
  accessKeyId,
  secretAccessKey,
  region,
  now,
}) {
  const date = amzDate(now);
  const day = date.slice(0, 8);
  const scope = `${day}/${region}/${SERVICE}/aws4_request`;
  const all = {
    ...Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim()]),
    ),
    host: url.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': date,
  };
  const names = Object.keys(all).sort();
  const canonicalHeaders = names.map((name) => `${name}:${all[name]}\n`).join('');
  const signedHeaders = names.join(';');
  const query = [...url.searchParams.entries()]
    .map(([k, v]) => [encode(k), encode(v)])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const canonicalRequest = [
    method,
    url.pathname,
    query,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const stringToSign = [ALGORITHM, date, scope, sha256Hex(canonicalRequest)].join('\n');
  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${secretAccessKey}`, day), region), SERVICE),
    'aws4_request',
  );
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  return {
    ...all,
    authorization: `${ALGORITHM} Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

const unescapeXml = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

/** One page of a listing, as the service answered it. */
export function parseListing(xml) {
  const objects = [...xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)].map(([, entry]) => ({
    key: unescapeXml(/<Key>([\s\S]*?)<\/Key>/.exec(entry)?.[1] ?? ''),
    size: Number(/<Size>(\d+)<\/Size>/.exec(entry)?.[1] ?? 0),
  }));
  const truncated = /<IsTruncated>true<\/IsTruncated>/.test(xml);
  const next = /<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/.exec(xml)?.[1];
  return { objects, next: truncated && next ? unescapeXml(next) : null };
}

/**
 * A bucket to list, read and write, and never delete from. `fetch` and `now`
 * are taken so a test can stand in for the service and the clock.
 */
export function bucket({
  endpoint,
  name,
  accessKeyId,
  secretAccessKey,
  fetch: doFetch = globalThis.fetch,
  now = () => new Date(),
}) {
  const base = new URL(endpoint);
  const region = regionOf(base.host);

  async function request(method, key, { query = {}, body = null, contentType = null } = {}) {
    const url = new URL(base);
    url.pathname = `/${[name, ...(key === '' ? [] : key.split('/'))].map(encode).join('/')}`;
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    const headers = sign({
      method,
      url,
      headers: body === null ? {} : { 'content-type': contentType, 'content-md5': md5Base64(body) },
      payloadHash: sha256Hex(body ?? ''),
      accessKeyId,
      secretAccessKey,
      region,
      now: now(),
    });
    return doFetch(url, { method, headers, body });
  }

  async function failed(method, key, response) {
    const code = /<Code>([\s\S]*?)<\/Code>/.exec(await response.text().catch(() => ''))?.[1];
    return new Error(
      `${method} ${key === '' ? '(listing)' : key}: ${response.status}${code ? ` ${code}` : ''}`,
    );
  }

  return {
    /** Every object under `prefix`, page after page. */
    async *list(prefix) {
      let token = null;
      do {
        const query = { 'list-type': '2', prefix, 'max-keys': String(LIST_PAGE) };
        if (token !== null) query['continuation-token'] = token;
        const response = await request('GET', '', { query });
        if (!response.ok) throw await failed('GET', '', response);
        const page = parseListing(await response.text());
        yield* page.objects;
        token = page.next;
      } while (token !== null);
    },
    /** The object's bytes, or null when there is no such object. */
    async get(key) {
      const response = await request('GET', key);
      if (response.status === 404) return null;
      if (!response.ok) throw await failed('GET', key, response);
      return new Uint8Array(await response.arrayBuffer());
    },
    /** Writes the object; over an existing key, the service keeps a new version. */
    async put(key, bytes, contentType = OBJECT_TYPE) {
      const response = await request('PUT', key, { body: bytes, contentType });
      if (!response.ok) throw await failed('PUT', key, response);
    },
  };
}

/** The keys under `prefix`, as a set, without the prefix. */
export async function keysUnder(store, prefix) {
  const keys = new Set();
  for await (const { key } of store.list(prefix)) keys.add(key.slice(prefix.length));
  return keys;
}
