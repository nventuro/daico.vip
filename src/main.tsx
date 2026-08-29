import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './shell/AppRouter.tsx';
import ErrorBoundary from './shell/ErrorBoundary.tsx';
import { installAppUpdates } from './lib/appUpdate.ts';

// A version newer than this one goes in before anything is drawn, so a screen
// is never half of one build and half of another. While that is being decided
// nothing is rendered, which keeps the splash up; when it goes in, the page is
// replaced and this one never draws at all.
void installAppUpdates().then((replacing) => {
  if (replacing) return;
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </BrowserRouter>
    </StrictMode>,
  );
});
