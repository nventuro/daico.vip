import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as engine from '../../lib/offline/engine';
import { GUIDE_IMAGE_CACHE } from '../../lib/offline/localTables';
import { server } from '../../lib/offline/testing/fakeSupabase';
import { guideImageUrl } from './guideImages';

vi.mock('sqlocal', () => import('../../lib/offline/testing/sqlocalInMemory'));
vi.mock('../../lib/supabase', () => import('../../lib/offline/testing/fakeSupabase'));

const IMAGES = 'guide_images';

/** An image on the server, keyed the way the importer writes it. */
function seed(key: string, mime: string, data: string): void {
  server.seed(IMAGES, [{ id: key, key, mime, data }]);
}

const fetches = () => server.calls.filter((call) => call.table === IMAGES).length;

const cached = () =>
  engine.localQuery<{ key: string; mime: string; data: string }>(
    `SELECT key, mime, data FROM ${GUIDE_IMAGE_CACHE.table}`,
  );

beforeEach(async () => {
  server.reset();
  await engine.clearAll();
});

describe('guideImageUrl', () => {
  it('fetches an image once and serves the local copy from then on', async () => {
    seed('k1', 'image/png', 'AAAA');

    expect(await guideImageUrl('k1')).toBe('data:image/png;base64,AAAA');
    expect(await cached()).toEqual([{ key: 'k1', mime: 'image/png', data: 'AAAA' }]);

    server.fail('select', IMAGES);
    // Served from the cache, so the server is never asked again — which is
    // also what makes a chapter render with no connection.
    expect(await guideImageUrl('k1')).toBe('data:image/png;base64,AAAA');
    expect(fetches()).toBe(1);
  });

  it('carries the mime type the image was stored with', async () => {
    seed('k1', 'image/jpeg', 'BBBB');
    expect(await guideImageUrl('k1')).toBe('data:image/jpeg;base64,BBBB');
  });

  it('keeps one image per key when two chapters ask for it at once', async () => {
    seed('k1', 'image/png', 'AAAA');
    // Both miss the cache and both write: the second must land on the first
    // rather than break the key.
    const [first, second] = await Promise.all([guideImageUrl('k1'), guideImageUrl('k1')]);
    expect(first).toBe('data:image/png;base64,AAAA');
    expect(second).toBe(first);
    expect(await cached()).toHaveLength(1);
  });

  it('has nothing for a key the server does not know, and keeps nothing', async () => {
    expect(await guideImageUrl('missing')).toBeNull();
    expect(await cached()).toEqual([]);
  });

  it('has nothing when the read fails, and asks again next time', async () => {
    seed('k1', 'image/png', 'AAAA');
    server.fail('select', IMAGES, 'network down');
    expect(await guideImageUrl('k1')).toBeNull();
    expect(await cached()).toEqual([]);

    server.restore();
    expect(await guideImageUrl('k1')).toBe('data:image/png;base64,AAAA');
  });
});
