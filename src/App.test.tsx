import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Session } from '@supabase/supabase-js';
import App from './App';

const device = vi.hoisted(() => ({ session: null as Session | null }));

// A client whose every read of the server never answers: what a device with
// no signal gets.
vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => new Promise(() => {}),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
  storedSession: () => device.session,
}));
vi.mock('./shell/AppContext', () => ({
  AppProvider: ({ session, children }: { session: Session | null; children: React.ReactNode }) => (
    <>
      <p>{session ? `in as ${session.user.id}` : 'nobody in'}</p>
      {children}
    </>
  ),
}));
vi.mock('./shell/MainLayout', () => ({ default: () => <main>the app</main> }));

afterEach(() => {
  device.session = null;
  vi.unstubAllGlobals();
});

describe('the boot', () => {
  it('draws the app from the session the device holds, with the server never answering', () => {
    device.session = { user: { id: 'u1' } } as Session;
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('in as u1');
    expect(html).toContain('the app');
  });

  it('draws the app for a device that holds no session, which is where it says to sign in', () => {
    expect(renderToStaticMarkup(<App />)).toContain('nobody in');
  });

  it('draws nothing on the way back from Google until the client has the session', () => {
    vi.stubGlobal('window', { location: { search: '?code=abc' } });
    device.session = { user: { id: 'u1' } } as Session;
    expect(renderToStaticMarkup(<App />)).toBe('');
  });
});
