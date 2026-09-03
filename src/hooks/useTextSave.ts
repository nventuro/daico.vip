import { useCallback, useEffect, useMemo, useRef } from 'react';
import { TEXT_SAVE_DELAY_MS } from '../components/editor/constants';

/** What a page hands its text to as it is typed. */
export interface TextSaver {
  /** Every change; nothing is written until typing stops. */
  onChange: (text: string) => void;
  /** Saves whatever is pending at once. */
  flush: () => void;
}

/**
 * Saves a text a moment after it stops changing, through `save`, and only
 * when it differs from what was last saved through it. A text of only
 * whitespace is passed as `''`; whether that is stored as empty or as null
 * is the caller's. A save that fails is logged, never shown: offline writes
 * never fail, so a rejection here is a bug and not a state to draw.
 */
export function createTextSaver(
  save: (text: string) => Promise<unknown>,
  delay = TEXT_SAVE_DELAY_MS,
): TextSaver {
  let pending: string | null = null;
  let saved: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function run() {
    timer = null;
    if (pending === null) return;
    const text = pending;
    pending = null;
    if (text === saved) return;
    saved = text;
    save(text).catch((err: unknown) => {
      console.warn('[editor] the text could not be saved:', err);
    });
  }

  return {
    onChange(text) {
      pending = text.trim() === '' ? '' : text;
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(run, delay);
    },
    flush() {
      if (timer !== null) clearTimeout(timer);
      run();
    },
  };
}

/**
 * How a page saves the text written on it: a moment after typing stops, and
 * always on leaving — the page unmounting, the app going to the background,
 * the tab being closed — so nothing typed is ever lost to the back button.
 * `save` may change between renders; the latest is the one called.
 */
export function useTextSave(save: (text: string) => Promise<unknown>): TextSaver {
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // The saver lives with the page: made when it mounts, flushed when it goes.
  const saverRef = useRef<TextSaver | null>(null);
  useEffect(() => {
    const saver = createTextSaver((text) => saveRef.current(text));
    saverRef.current = saver;
    const onHidden = () => {
      if (document.visibilityState === 'hidden') saver.flush();
    };
    window.addEventListener('pagehide', saver.flush);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      window.removeEventListener('pagehide', saver.flush);
      document.removeEventListener('visibilitychange', onHidden);
      saver.flush();
      saverRef.current = null;
    };
  }, []);

  const onChange = useCallback((text: string) => saverRef.current?.onChange(text), []);
  const flush = useCallback(() => saverRef.current?.flush(), []);
  return useMemo(() => ({ onChange, flush }), [onChange, flush]);
}
