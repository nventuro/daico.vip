import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TEXT_SAVE_DELAY_MS } from '../components/editor/constants';
import { createTextSaver } from './useTextSave';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function saver() {
  const save = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
  return { save, ...createTextSaver(save) };
}

describe('saving a text as it is typed', () => {
  it('collapses the keystrokes into one save, a moment after the last', () => {
    const { save, onChange } = saver();
    onChange('h');
    onChange('ho');
    vi.advanceTimersByTime(TEXT_SAVE_DELAY_MS - 1);
    onChange('hol');
    vi.advanceTimersByTime(TEXT_SAVE_DELAY_MS - 1);
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(save.mock.calls).toEqual([['hol']]);
  });

  it('saves what is pending on flush, at once', () => {
    const { save, onChange, flush } = saver();
    onChange('hola');
    flush();
    expect(save.mock.calls).toEqual([['hola']]);
    vi.advanceTimersByTime(TEXT_SAVE_DELAY_MS);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('saves nothing while nothing has changed since the last save', () => {
    const { save, onChange, flush } = saver();
    onChange('hola');
    flush();
    onChange('hola');
    vi.advanceTimersByTime(TEXT_SAVE_DELAY_MS);
    flush();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('passes a text of only whitespace as empty', () => {
    const { save, onChange, flush } = saver();
    onChange('  \n\n ');
    flush();
    expect(save.mock.calls).toEqual([['']]);
  });
});
