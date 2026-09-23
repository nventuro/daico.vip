// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useNavigate, type NavigateFunction } from 'react-router-dom';
import CompletedSection from './CompletedSection';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement;
let navigate: NavigateFunction;

function Navigator() {
  const current = useNavigate();
  useEffect(() => {
    navigate = current;
  }, [current]);
  return null;
}

// The history entry the router opens on; each test's is its own, as every
// open of the app's is.
let opens = 0;

function mount(): void {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <MemoryRouter initialEntries={[{ pathname: '/', key: `open-${++opens}` }]}>
        <Navigator />
        <Routes>
          <Route
            path="/"
            element={
              <CompletedSection label="Hechas" count={1}>
                <p data-done>hecha</p>
              </CompletedSection>
            }
          />
          <Route path="/entry" element={<p>entrada</p>} />
        </Routes>
      </MemoryRouter>,
    ),
  );
}

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  container.remove();
});

const shown = () => container.querySelector('[data-done]') !== null;
const heading = () => container.querySelector('button')!;

describe('a completed section', () => {
  it('starts collapsed and opens on its heading', () => {
    mount();
    expect(shown()).toBe(false);
    act(() => heading().click());
    expect(shown()).toBe(true);
  });

  it('is still open when its screen is gone back to', () => {
    mount();
    act(() => heading().click());
    act(() => void navigate('/entry'));
    act(() => void navigate(-1));
    expect(shown()).toBe(true);
  });

  it('is collapsed on a screen reached anew', () => {
    mount();
    act(() => heading().click());
    act(() => void navigate('/entry'));
    act(() => void navigate('/'));
    expect(shown()).toBe(false);
  });

  it('stays closed when gone back to after being closed', () => {
    mount();
    act(() => heading().click());
    act(() => heading().click());
    act(() => void navigate('/entry'));
    act(() => void navigate(-1));
    expect(shown()).toBe(false);
  });
});
