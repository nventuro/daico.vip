import { useLocation } from 'react-router-dom';

/**
 * What the add bar typed on the way to a creation route. The row is written on
 * save rather than on typing — backing out must leave nothing behind — so this
 * is all a new entry starts from, and it is carried in the navigation rather
 * than the URL to keep what the household writes out of the address bar.
 */
export function useDraftTitle(): string {
  const { state } = useLocation();
  const title = (state as { title?: unknown } | null)?.title;
  return typeof title === 'string' ? title : '';
}

/** What a screen navigating to a creation route hands it. */
export function draftTitleState(title: string): { title: string } {
  return { title };
}
