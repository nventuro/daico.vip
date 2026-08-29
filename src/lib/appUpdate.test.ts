import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TAKEOVER_TIMEOUT_MS } from './appUpdate';

type Handler = () => void;

/** The listeners an object has collected, and the way the browser calls them. */
function events() {
  const handlers = new Map<string, Set<Handler>>();
  return {
    addEventListener(type: string, handler: Handler, options?: { once?: boolean }) {
      const set = handlers.get(type) ?? new Set<Handler>();
      handlers.set(type, set);
      if (!options?.once) return void set.add(handler);
      const once = () => {
        set.delete(once);
        handler();
      };
      set.add(once);
    },
    fire(type: string) {
      for (const handler of [...(handlers.get(type) ?? [])]) handler();
    },
  };
}

interface FakeWorker {
  state: string;
  posted: unknown[];
  addEventListener: ReturnType<typeof events>['addEventListener'];
  postMessage(message: unknown): void;
  /** Move the worker along its lifecycle, as the browser would. */
  become(state: string): void;
}

interface BrowserOptions {
  /** A build already downloaded and waiting when the page starts. */
  waiting?: boolean;
  /** Whether a worker told to stop waiting actually takes control. */
  takesOver?: boolean;
  /** Whether some worker is already in charge of this page. */
  controlled?: boolean;
}

/**
 * A stand-in for the part of the Service Worker API the app uses: a
 * registration whose workers install, wait and take control, plus the two
 * events the app hangs off — the connection returning and the app changing
 * screens. Drives them from the test's side, and counts the reloads.
 */
function fakeBrowser({
  waiting = false,
  takesOver = true,
  controlled = true,
}: BrowserOptions = {}) {
  const container = events();
  const win = events();
  const doc = events();
  let reloads = 0;
  let controller: FakeWorker | null = null;

  function worker(state: string): FakeWorker {
    const own = events();
    const self: FakeWorker = {
      state,
      posted: [],
      addEventListener: own.addEventListener,
      postMessage(message) {
        self.posted.push(message);
        if (!takesOver) return;
        // Stopping waiting hands every page this worker's way over to it.
        queueMicrotask(() => {
          controller = self;
          container.fire('controllerchange');
        });
      },
      become(next) {
        self.state = next;
        own.fire('statechange');
      },
    };
    return self;
  }

  if (controlled) controller = worker('activated');

  const found = events();
  const registration = {
    installing: null as FakeWorker | null,
    waiting: waiting ? worker('installed') : null,
    update: vi.fn(async () => {}),
    addEventListener: found.addEventListener,
    fire: found.fire,
  };

  const registered: { url: string; options: unknown }[] = [];

  vi.stubGlobal('navigator', {
    serviceWorker: {
      get controller() {
        return controller;
      },
      getRegistration: async () => registration,
      register: async (url: string, options: unknown) => {
        registered.push({ url, options });
        return registration;
      },
      addEventListener: container.addEventListener,
    },
  });
  vi.stubGlobal('window', {
    addEventListener: win.addEventListener,
    location: {
      reload: () => {
        reloads += 1;
      },
    },
  });
  vi.stubGlobal('document', {
    visibilityState: 'visible',
    addEventListener: doc.addEventListener,
  });

  return {
    registration,
    registered,
    reloads: () => reloads,
    /** A build finishes downloading while the app is in use. */
    arrive() {
      const arriving = worker('installing');
      registration.installing = arriving;
      registration.fire('updatefound');
      registration.installing = null;
      registration.waiting = arriving;
      arriving.become('installed');
      return arriving;
    },
    hide() {
      (globalThis.document as unknown as { visibilityState: string }).visibilityState = 'hidden';
      doc.fire('visibilitychange');
    },
    show() {
      (globalThis.document as unknown as { visibilityState: string }).visibilityState = 'visible';
      doc.fire('visibilitychange');
    },
    reconnect: () => win.fire('online'),
  };
}

async function load() {
  return import('./appUpdate');
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('PROD', true);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('installAppUpdates', () => {
  it('goes in with a build that was waiting, before the app draws anything', async () => {
    const browser = fakeBrowser({ waiting: true });
    const { installAppUpdates } = await load();

    expect(await installAppUpdates()).toBe(true);
    expect(browser.registration.waiting?.posted).toEqual([{ type: 'SKIP_WAITING' }]);
    expect(browser.reloads()).toBe(1);
    // The page is on its way out: nothing was registered or watched.
    expect(browser.registered).toEqual([]);
  });

  it('draws with the build it has when nothing is waiting, and asks the network for the worker', async () => {
    const browser = fakeBrowser();
    const { installAppUpdates, isUpdateWaiting } = await load();

    expect(await installAppUpdates()).toBe(false);
    expect(browser.reloads()).toBe(0);
    expect(isUpdateWaiting()).toBe(false);
    expect(browser.registered).toEqual([
      { url: '/sw.js', options: { scope: '/', updateViaCache: 'none' } },
    ]);
  });

  it('leaves the page alone when the waiting build never takes control', async () => {
    const browser = fakeBrowser({ waiting: true, takesOver: false });
    const { installAppUpdates } = await load();

    const answer = installAppUpdates();
    await vi.advanceTimersByTimeAsync(TAKEOVER_TIMEOUT_MS);
    // A reload that lands on the same build would only ask again.
    expect(await answer).toBe(false);
    expect(browser.reloads()).toBe(0);
  });

  it('does nothing at all outside a build', async () => {
    vi.stubEnv('PROD', false);
    const browser = fakeBrowser({ waiting: true });
    const { installAppUpdates } = await load();

    expect(await installAppUpdates()).toBe(false);
    expect(browser.registered).toEqual([]);
    expect(browser.reloads()).toBe(0);
  });
});

describe('a build arriving while the app is in use', () => {
  it('waits, and says so, instead of taking the running page', async () => {
    const browser = fakeBrowser();
    const { installAppUpdates, isUpdateWaiting, subscribeUpdate } = await load();
    await installAppUpdates();

    let told = 0;
    subscribeUpdate(() => {
      told += 1;
    });
    const arriving = browser.arrive();

    expect(isUpdateWaiting()).toBe(true);
    expect(told).toBe(1);
    expect(arriving.posted).toEqual([]);
    expect(browser.reloads()).toBe(0);
  });

  it('is not announced when it is the first worker this device ever had', async () => {
    const browser = fakeBrowser({ controlled: false });
    const { installAppUpdates, isUpdateWaiting } = await load();
    await installAppUpdates();

    browser.arrive();

    expect(isUpdateWaiting()).toBe(false);
  });

  it('goes in when the app leaves the screen', async () => {
    const browser = fakeBrowser();
    const { installAppUpdates } = await load();
    await installAppUpdates();
    const arriving = browser.arrive();

    browser.hide();
    await vi.advanceTimersByTimeAsync(0);

    expect(arriving.posted).toEqual([{ type: 'SKIP_WAITING' }]);
    expect(browser.reloads()).toBe(1);
  });

  it('goes in when the member asks for it outright', async () => {
    const browser = fakeBrowser();
    const { installAppUpdates, applyUpdate } = await load();
    await installAppUpdates();
    const arriving = browser.arrive();

    applyUpdate();
    await vi.advanceTimersByTimeAsync(0);

    expect(arriving.posted).toEqual([{ type: 'SKIP_WAITING' }]);
    expect(browser.reloads()).toBe(1);
  });

  it('stays put while the app is on screen', async () => {
    const browser = fakeBrowser();
    const { installAppUpdates } = await load();
    await installAppUpdates();
    const arriving = browser.arrive();

    browser.show();
    await vi.advanceTimersByTimeAsync(0);

    expect(arriving.posted).toEqual([]);
    expect(browser.reloads()).toBe(0);
  });
});

describe('asking whether there is a new build', () => {
  it('asks when the app comes back to the screen and when the connection returns', async () => {
    const browser = fakeBrowser();
    const { installAppUpdates } = await load();
    await installAppUpdates();

    browser.show();
    expect(browser.registration.update).toHaveBeenCalledTimes(1);

    browser.reconnect();
    expect(browser.registration.update).toHaveBeenCalledTimes(2);
  });

  it('does not ask on the way out — that is when it hands over', async () => {
    const browser = fakeBrowser();
    const { installAppUpdates } = await load();
    await installAppUpdates();

    browser.hide();
    expect(browser.registration.update).not.toHaveBeenCalled();
  });
});
