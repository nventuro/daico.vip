// =============================================================================
// The member Salud last showed on this device, so it opens on the same one
// next time. Kept on the device like the membership verdict is, and
// forgotten with everything else when the session ends. It lives here rather
// than beside Salud because the sign-out that forgets it is the shell's, and
// what the shell reaches through lib may not come from an app.
// =============================================================================

/** localStorage key for the id of the member last viewed. */
const VIEWED_KEY = 'daico.salud.viewed';

// Storage may be absent or refuse (a private window, a storage policy); then
// the device simply opens on the first member every time.
function storage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

/** The id of the member last viewed on this device, if one was kept. */
export function rememberedViewed(): string | null {
  return storage()?.getItem(VIEWED_KEY) ?? null;
}

/** Keep which member is being viewed. */
export function rememberViewed(id: string): void {
  try {
    storage()?.setItem(VIEWED_KEY, id);
  } catch {
    // Storage full or refused: the choice lives for the session and no longer.
  }
}

/** Forget which member was viewed, so the next session opens on the first. */
export function forgetViewed(): void {
  try {
    storage()?.removeItem(VIEWED_KEY);
  } catch {
    // Nothing was kept, then.
  }
}
