import { supabase } from '../../lib/supabase';
import * as engine from '../../lib/offline/engine';
import { GUIDE_IMAGE_CACHE } from '../../lib/offline/localTables';

/** An image's MIME type and base64-encoded contents. */
type CachedImage = { mime: string; data: string };

const toDataUrl = (image: CachedImage) => `data:${image.mime};base64,${image.data}`;

/** The locally cached image for a key, or null if it has never been fetched. */
async function cached(key: string): Promise<CachedImage | null> {
  const rows = await engine.localQuery<CachedImage>(
    `SELECT mime, data FROM ${GUIDE_IMAGE_CACHE.table} WHERE key = ?`,
    key,
  );
  return rows[0] ?? null;
}

/** Keep an image locally so later reads need no connection. */
async function keep(key: string, image: CachedImage): Promise<void> {
  await engine.localWrite(
    GUIDE_IMAGE_CACHE.table,
    `INSERT OR REPLACE INTO ${GUIDE_IMAGE_CACHE.table} (key, mime, data) VALUES (?, ?, ?)`,
    key,
    image.mime,
    image.data,
  );
}

/**
 * Resolve a chapter image key to a URL the browser can display. The first
 * request for a key fetches it from the server and caches it locally; every
 * later request is served from the cache, so previously viewed chapters render
 * offline. Returns null when the image is unavailable (offline and never
 * fetched, or an unknown key).
 */
export async function guideImageUrl(key: string): Promise<string | null> {
  const held = await cached(key);
  if (held) return toDataUrl(held);
  const { data, error } = await supabase
    .from('guide_images')
    .select('mime, data')
    .eq('key', key)
    .maybeSingle();
  if (error || !data) return null;
  const image = data as CachedImage;
  await keep(key, image);
  return toDataUrl(image);
}
