import { useSyncExternalStore } from 'react';
import { todayIso } from '../utils/dateUtils';

// Today, as a screen reads it: the day changes at midnight and when the app
// comes back after being away, and a screen left open through either must
// say «hoy» of the right day and colour what is overdue as overdue.
let today = todayIso();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

/** A millisecond past midnight: on the day's side of it, whatever the clock's
 *  rounding. */
const PAST_MIDNIGHT_MS = 1000;

function refresh(): void {
  const now = todayIso();
  if (now !== today) {
    today = now;
    listeners.forEach((listener) => listener());
  }
}

function scheduleMidnight(): void {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  timer = setTimeout(
    () => {
      refresh();
      scheduleMidnight();
    },
    midnight.getTime() - now.getTime() + PAST_MIDNIGHT_MS,
  );
}

function onVisible(): void {
  if (document.visibilityState === 'visible') refresh();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    refresh();
    scheduleMidnight();
    document.addEventListener('visibilitychange', onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      document.removeEventListener('visibilitychange', onVisible);
    }
  };
}

function snapshot(): string {
  return today;
}

/** Today (yyyy-mm-dd), kept current across midnight and the app's returns. */
export function useToday(): string {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
