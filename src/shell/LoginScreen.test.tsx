import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('./appContext', () => ({ useAppContext: () => ({ signIn: () => {} }) }));
vi.mock('../hooks/useOnline', () => ({ useOnline: () => true }));

const { default: LoginScreen } = await import('./LoginScreen');

/** The classes of each element of a markup, in order; an element's own
 *  classes as a set, since the two sides write them in different orders. */
const classesOf = (html: string) =>
  [...html.matchAll(/class="([^"]*)"/g)].map((m) => m[1].split(/\s+/).sort().join(' '));

/** What a markup says, tags and spacing aside. */
const said = (html: string) => html.replace(/<\/?[^>]+>/g, '').replace(/\s+/g, '');

const footerOf = (html: string) => /<footer[\s\S]*?<\/footer>/.exec(html)?.[0] ?? '';

// The splash in index.html stays up until the app draws, and the login screen
// is what takes over from it: the two are one frame, so nothing moves. The
// splash cannot share the screen's code, so this is what keeps them the same.
describe('the login screen and the splash', () => {
  const splash = /<div\s+id="splash"[\s\S]*?<\/footer>\s*<\/div>\s*<\/div>/.exec(
    fs.readFileSync('index.html', 'utf8'),
  )?.[0];
  const screen = renderToStaticMarkup(<LoginScreen />);

  it('share one frame: the mark at the centre, the rest hanging below', () => {
    expect(splash).toBeDefined();
    // The frame, the mark, what hangs below, its column, the name, the line:
    // every one of the splash's, in its order, among the screen's, which
    // draws the logo out of more elements than a picture is.
    const drawn = classesOf(screen);
    let at = 0;
    for (const element of classesOf(splash!).slice(0, 6)) {
      const found = drawn.indexOf(element, at);
      expect(found, element).toBeGreaterThanOrEqual(0);
      at = found + 1;
    }
  });

  it('share one footer', () => {
    expect(classesOf(footerOf(screen))).toEqual(classesOf(footerOf(splash!)));
    expect(said(footerOf(screen))).toBe(said(footerOf(splash!)));
  });
});
