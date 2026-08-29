// =============================================================================
// When a build newer than the running one takes over. The service worker keeps
// a whole build at a time, so the only thing that matters is *when* the new one
// is allowed to replace the old: a swap under a page that is already running
// leaves half of each, which is why the worker is registered `prompt` and waits.
//
// It goes in at one of two moments, both of them with nobody looking:
//   - at boot, before the app has drawn anything;
//   - when the app leaves the screen, so coming back is coming back to the new
//     one.
// A member who never puts the app down is told, and can ask for it outright.
// =============================================================================

/** Where the plugin writes the worker, at the app's own scope. */
const SERVICE_WORKER_URL = '/sw.js';

/** How long to wait for the new build to take control before giving up and
 *  going on with the one already running. Under the splash's own «está
 *  tardando» hint, so a boot that hits this never looks stuck. */
export const TAKEOVER_TIMEOUT_MS = 4000;

// The build that is downloaded and waiting for its turn, if there is one.
let waiting: ServiceWorker | null = null;
// Set for good once a takeover is under way: the page is being replaced, and a
// second attempt would only race the first.
let takingOver = false;
const listeners = new Set<() => void>();

/** Whether a version newer than the running one is downloaded and waiting. */
export function isUpdateWaiting(): boolean {
  return waiting !== null;
}

/** Run `listener` when that changes; returns the unsubscribe. */
export function subscribeUpdate(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setWaiting(worker: ServiceWorker): void {
  if (waiting === worker) return;
  waiting = worker;
  listeners.forEach((listener) => listener());
}

/**
 * Hand the page over to a waiting build: tell it to stop waiting, and reload
 * once it has taken control, so what comes back is one build and not two mixed.
 * Answers whether the page is on its way out — it stays as it is if the worker
 * never takes over, which is better than a reload that lands on the same build
 * and asks again.
 */
async function takeOver(worker: ServiceWorker): Promise<boolean> {
  if (takingOver) return true;
  takingOver = true;
  const took = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), TAKEOVER_TIMEOUT_MS);
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        clearTimeout(timer);
        resolve(true);
      },
      { once: true },
    );
    worker.postMessage({ type: 'SKIP_WAITING' });
  });
  if (!took) {
    takingOver = false;
    return false;
  }
  window.location.reload();
  return true;
}

/** Go in with the waiting version now, for the member who asks. */
export function applyUpdate(): void {
  if (waiting) void takeOver(waiting);
}

/** Watch a registration for a build arriving while the app is in use. */
function watchForUpdates(registration: ServiceWorkerRegistration): void {
  const onFound = () => {
    const arriving = registration.installing;
    if (!arriving) return;
    arriving.addEventListener('statechange', () => {
      // Installed with somebody already in control means this is a build newer
      // than the running one; with nobody, it is this build's own first install.
      if (arriving.state === 'installed' && navigator.serviceWorker.controller) {
        setWaiting(registration.waiting ?? arriving);
      }
    });
  };
  registration.addEventListener('updatefound', onFound);
  // One may have been on its way already when this page started.
  onFound();
}

/** Ask, and hand over, at the moments the app changes hands. */
function installUpdateTriggers(registration: ServiceWorkerRegistration): void {
  const ask = () => void registration.update().catch(() => {});
  window.addEventListener('online', ask);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') ask();
    else if (waiting) void takeOver(waiting);
  });
}

/**
 * Register the worker and take charge of when a new build goes in. Answers
 * whether the page is being replaced by one right now, in which case the caller
 * draws nothing: the splash stays up until the new build's own paint.
 *
 * Never throws — a device that cannot run a service worker simply runs the
 * build it loaded.
 */
export async function installAppUpdates(): Promise<boolean> {
  // The worker only exists in a build; the dev server serves no `/sw.js`.
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return false;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    // A build that was already waiting when this page started goes in now,
    // before anything is drawn.
    if (existing?.waiting && (await takeOver(existing.waiting))) return true;
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
      scope: '/',
      // Ask the network for the worker itself rather than the browser's cache:
      // the host serves it with ten minutes of freshness, which would be ten
      // minutes of answering that there is nothing new when there is.
      updateViaCache: 'none',
    });
    watchForUpdates(registration);
    installUpdateTriggers(registration);
  } catch (err) {
    console.warn('[update] the service worker could not be registered:', err);
  }
  return false;
}
