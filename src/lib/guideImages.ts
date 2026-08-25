import { supabase } from './supabase';
import * as engine from './offline/engine';

const toDataUrl = (image: engine.CachedImage) => `data:${image.mime};base64,${image.data}`;

/**
 * Resolve a chapter image key to a URL the browser can display. The first
 * request for a key fetches it from the server and caches it locally; every
 * later request is served from the cache, so previously viewed chapters render
 * offline. Returns null when the image is unavailable (offline and never
 * fetched, or an unknown key).
 */
export async function guideImageUrl(key: string): Promise<string | null> {
  const cached = await engine.getCachedImage(key);
  if (cached) return toDataUrl(cached);
  const { data, error } = await supabase
    .from('guide_images')
    .select('mime, data')
    .eq('key', key)
    .maybeSingle();
  if (error || !data) return null;
  const image = data as engine.CachedImage;
  await engine.putCachedImage(key, image);
  return toDataUrl(image);
}
