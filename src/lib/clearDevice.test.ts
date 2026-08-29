import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CHORES_SPEC } from './offline/specs';
import * as engine from './offline/engine';
import { getSyncStatus, syncAll } from './offline/sync';
import { cachedVerdict, rememberVerdict } from './membershipCache';
import { clearDevice } from './clearDevice';
import { localAttachmentFile, putAttachmentFile } from './attachmentFiles';

vi.mock('sqlocal', () => import('./offline/testing/sqlocalInMemory'));
vi.mock('./supabase', () => import('./offline/testing/fakeSupabase'));

const cleared = vi.fn(async () => {});
vi.mock('./masterKeyStore', () => ({ clearMasterKey: () => cleared() }));

// Node has no Web Storage; the verdict is kept in one for the length of a test.
const stored = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => stored.get(key) ?? null,
  setItem: (key: string, value: string) => stored.set(key, value),
  removeItem: (key: string) => stored.delete(key),
});

// Node's navigator has no `onLine`; the sync engine bails out without it.
Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });

beforeEach(async () => {
  stored.clear();
  cleared.mockClear();
  await engine.clearAll();
});

describe('clearDevice', () => {
  it('leaves the device holding nothing of the household', async () => {
    await engine.insert(CHORES_SPEC, { title: 'Regar', notes: null, done: false, due_on: null });
    await putAttachmentFile('a', new TextEncoder().encode('abc'), true);
    rememberVerdict('u1', true);
    await syncAll();
    expect(getSyncStatus().completedAt).not.toBeNull();

    await clearDevice('u1');

    expect(await engine.listVisible(CHORES_SPEC)).toEqual([]);
    expect(await localAttachmentFile('a')).toBeNull();
    expect(cachedVerdict('u1')).toBeNull();
    expect(cleared).toHaveBeenCalled();
    expect(getSyncStatus().completedAt).toBeNull();
  });

  it('goes on with the rest when a step fails, and says so', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    cleared.mockRejectedValueOnce(new Error('no IndexedDB'));
    rememberVerdict('u1', true);
    try {
      await expect(clearDevice('u1')).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalled();
      expect(cachedVerdict('u1')).toBeNull();
    } finally {
      warn.mockRestore();
    }
  });

  it('clears a device that never knew whose session it was', async () => {
    await expect(clearDevice(null)).resolves.toBeUndefined();
    expect(cleared).toHaveBeenCalled();
  });
});
