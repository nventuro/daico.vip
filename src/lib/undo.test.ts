import { describe, it, expect, beforeEach, vi } from 'vitest';

type Undo = typeof import('./undo');

let undo: Undo;

// The offer is the module's own state, so every test starts with nothing to undo.
beforeEach(async () => {
  vi.resetModules();
  undo = await import('./undo');
});

function offer(overrides: Partial<import('./undo').UndoOffer> = {}) {
  return { message: 'Tarea hecha', undo: vi.fn(), onEnd: vi.fn(), ...overrides };
}

describe('the one undo', () => {
  it('runs what reverses the offer when it is taken, and says it was', () => {
    const a = offer();
    undo.offerUndo(a);
    undo.takeUndo(a);
    expect(a.undo).toHaveBeenCalledOnce();
    expect(a.onEnd).toHaveBeenCalledWith(true);
    expect(undo.undoState().offer).toBeNull();
  });

  it('lets an offer go untaken when it ends', () => {
    const a = offer();
    undo.offerUndo(a);
    undo.endUndo(a);
    expect(a.undo).not.toHaveBeenCalled();
    expect(a.onEnd).toHaveBeenCalledWith(false);
  });

  it('lets the earlier offer go when a later one replaces it', () => {
    const a = offer();
    const b = offer();
    undo.offerUndo(a);
    undo.offerUndo(b);
    expect(a.onEnd).toHaveBeenCalledWith(false);
    expect(undo.undoState().offer).toBe(b);
    // The one replaced can no longer be taken, nor ended twice.
    undo.takeUndo(a);
    undo.endUndo(a);
    expect(a.undo).not.toHaveBeenCalled();
    expect(a.onEnd).toHaveBeenCalledOnce();
    expect(undo.undoState().offer).toBe(b);
  });

  it('keeps the first sighting of an offer, and forgets it with the offer', () => {
    const a = offer();
    undo.offerUndo(a);
    expect(undo.undoState().shownAt).toBeNull();
    undo.undoShown(a, 1000);
    undo.undoShown(a, 4000);
    expect(undo.undoState().shownAt).toBe(1000);
    undo.offerUndo(offer());
    expect(undo.undoState().shownAt).toBeNull();
  });

  it('counts the screens drawing it above a bar of their own', () => {
    const leaveA = undo.registerUndoHost();
    const leaveB = undo.registerUndoHost();
    expect(undo.undoState().hosts).toBe(2);
    leaveA();
    expect(undo.undoState().hosts).toBe(1);
    leaveB();
    expect(undo.undoState().hosts).toBe(0);
  });

  it('tells its listeners of every change, as one object per state', () => {
    const listener = vi.fn();
    undo.subscribeUndo(listener);
    const before = undo.undoState();
    undo.offerUndo(offer());
    expect(listener).toHaveBeenCalledOnce();
    expect(undo.undoState()).not.toBe(before);
    expect(undo.undoState()).toBe(undo.undoState());
  });
});
