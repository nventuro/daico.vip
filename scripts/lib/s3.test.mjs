import { describe, it, expect } from 'vitest';
import { bucket, parseListing, regionOf, sign } from './s3.mjs';

// The worked example in AWS's own documentation of Signature Version 4 for
// S3 (a GET of the first ten bytes of an object): what a correct signer
// answers it with is published there, so a signer that agrees with it agrees
// with every service that speaks the protocol.
describe('sign', () => {
  it('reproduces the published example', () => {
    const headers = sign({
      method: 'GET',
      url: new URL('https://examplebucket.s3.amazonaws.com/test.txt'),
      headers: { Range: 'bytes=0-9' },
      payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      region: 'us-east-1',
      now: new Date('2013-05-24T00:00:00Z'),
    });
    expect(headers['x-amz-date']).toBe('20130524T000000Z');
    expect(headers.authorization).toBe(
      'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, ' +
        'SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, ' +
        'Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41',
    );
  });
});

describe('regionOf', () => {
  it('knows the two services, and a default', () => {
    expect(regionOf('0123456789abcdef.r2.cloudflarestorage.com')).toBe('auto');
    expect(regionOf('s3.us-west-004.backblazeb2.com')).toBe('us-west-004');
    expect(regionOf('s3.amazonaws.com')).toBe('us-east-1');
  });
});

const page = (objects, next) => `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>daico-backups</Name><IsTruncated>${next ? 'true' : 'false'}</IsTruncated>
  ${next ? `<NextContinuationToken>${next}</NextContinuationToken>` : ''}
  ${objects.map(([key, size]) => `<Contents><Key>${key}</Key><Size>${size}</Size></Contents>`).join('')}
</ListBucketResult>`;

describe('parseListing', () => {
  it('reads the keys, the sizes and where the next page starts', () => {
    expect(
      parseListing(
        page(
          [
            ['objects/a', 10],
            ['objects/b&amp;c', 20],
          ],
          'tok&amp;en',
        ),
      ),
    ).toEqual({
      objects: [
        { key: 'objects/a', size: 10 },
        { key: 'objects/b&c', size: 20 },
      ],
      next: 'tok&en',
    });
    expect(parseListing(page([], null)).next).toBeNull();
  });
});

/** A service in memory: what it was asked, and what it answers. */
function service(answers) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url: new URL(url), method: init.method, headers: init.headers, body: init.body });
    const answer = answers.shift();
    return new Response(answer.body ?? null, { status: answer.status ?? 200 });
  };
  return { calls, fetch };
}

const store = (fetch) =>
  bucket({
    endpoint: 'https://s3.us-west-004.backblazeb2.com',
    name: 'daico-backups',
    accessKeyId: 'k',
    secretAccessKey: 's',
    fetch,
    now: () => new Date('2026-09-07T06:00:00Z'),
  });

describe('bucket', () => {
  it('lists page after page under a prefix, path-style', async () => {
    const { calls, fetch } = service([
      { body: page([['objects/a', 1]], 'more') },
      { body: page([['objects/b', 2]], null) },
    ]);
    const keys = [];
    for await (const object of store(fetch).list('objects/')) keys.push(object.key);
    expect(keys).toEqual(['objects/a', 'objects/b']);
    expect(calls[0].url.pathname).toBe('/daico-backups');
    expect(calls[0].url.searchParams.get('prefix')).toBe('objects/');
    expect(calls[1].url.searchParams.get('continuation-token')).toBe('more');
    expect(calls[0].headers.authorization).toMatch(
      /^AWS4-HMAC-SHA256 Credential=k\/20260907\/us-west-004\/s3\/aws4_request, /,
    );
  });

  it('gets an object, and null for one that is not there', async () => {
    const { calls, fetch } = service([{ body: new Uint8Array([1, 2, 3]) }, { status: 404 }]);
    const s = store(fetch);
    expect(await s.get('daily/x.age')).toEqual(new Uint8Array([1, 2, 3]));
    expect(await s.get('daily/y.age')).toBeNull();
    expect(calls[0].url.pathname).toBe('/daico-backups/daily/x.age');
  });

  it('puts an object as an opaque blob, and reports a refusal', async () => {
    const { calls, fetch } = service([
      { status: 200 },
      { status: 403, body: '<Error><Code>AccessDenied</Code></Error>' },
    ]);
    const s = store(fetch);
    await s.put('objects/a', new Uint8Array([9]));
    expect(calls[0].method).toBe('PUT');
    expect(calls[0].headers['content-type']).toBe('application/octet-stream');
    expect(calls[0].headers['x-amz-content-sha256']).toMatch(/^[0-9a-f]{64}$/);
    expect(calls[0].headers['content-md5']).toBe('XnMqGHi+I0Lb/v9f48paow==');
    expect(calls[0].headers.authorization).toContain(
      'SignedHeaders=content-md5;content-type;host;',
    );
    await expect(s.put('objects/b', new Uint8Array([9]))).rejects.toThrow(
      'PUT objects/b: 403 AccessDenied',
    );
  });
});
