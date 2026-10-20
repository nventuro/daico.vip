// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { Attachment } from '../lib/offline/specs';

// The DOM here draws a <dialog> but cannot open one; the lightbox opens as a
// modal, so it is given the move it makes.
if (!('showModal' in HTMLDialogElement.prototype)) {
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.open = true;
    },
  });
}
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../hooks/useAttachmentFile', () => ({
  useAttachmentFile: () => ({ status: 'unavailable' }),
}));
vi.mock('../hooks/useAttachmentUploadState', () => ({
  useAttachmentUploadState: () => 'uploaded',
}));
vi.mock('../hooks/useOnline', () => ({ useOnline: () => true }));
vi.mock('../hooks/useObjectUrl', () => ({ useObjectUrl: () => null }));
vi.mock('../hooks/usePdf', () => ({ usePdf: () => ({ status: 'idle' }) }));
vi.mock('../lib/appUpdate', () => ({ holdUpdates: () => () => {} }));

const { default: AttachmentLightbox } = await import('./AttachmentLightbox');

const STAMPS = { created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };

function attachment(id: string, name: string): Attachment {
  return {
    id,
    owner_kind: 'chore',
    owner_id: 't1',
    name,
    mime: 'image/jpeg',
    size: 10,
    wrapped_file_key: 'k',
    ...STAMPS,
  };
}

const OWNER_PATH = '/tareas/t1';
const onRemove = vi.fn(() => Promise.resolve());
const onRename = vi.fn(() => Promise.resolve());

// Where the router stands, drawn beside the lightbox to be read.
function Where() {
  return <span data-where>{useLocation().pathname}</span>;
}

let root: Root | null = null;
let container: HTMLDivElement;

function mount(attachments: Attachment[], index = 0): void {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <MemoryRouter initialEntries={[`${OWNER_PATH}/${attachments[index].id}`]}>
        <AttachmentLightbox
          attachments={attachments}
          index={index}
          ownerPath={OWNER_PATH}
          onRemove={onRemove}
          onRename={onRename}
        />
        <Where />
      </MemoryRouter>,
    );
  });
}

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  container.remove();
  onRemove.mockClear();
  onRename.mockClear();
});

/** The name's field, drawn under the file. */
function field(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[aria-label="Nombre"]');
  if (!input) throw new Error('no name field');
  return input;
}

/** What the router's path is now. */
function path(): string | undefined {
  return container.querySelector('[data-where]')?.textContent;
}

function type(input: HTMLInputElement, text: string): void {
  act(() => {
    // Set past the property React keeps on the element, so the input event
    // reads as a change.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function leave(input: HTMLInputElement): void {
  act(() => {
    input.focus();
    input.blur();
  });
}

function press(target: EventTarget, key: string): void {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });
}

type Point = { x: number; y: number };

/** A gesture over the file: each finger down from its point, then the first
 *  one lifted where it ends. */
function drag(fingers: Point[], end: Point): void {
  const target = document.querySelector('dialog span.absolute');
  if (!target) throw new Error('no file area');
  const touch = ({ x, y }: Point) => ({ clientX: x, clientY: y });
  function fire(type: string, touches: Point[], changed: Point[]): void {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, { touches: touches.map(touch), changedTouches: changed.map(touch) });
    target?.dispatchEvent(event);
  }
  act(() => {
    fingers.forEach((_, i) => fire('touchstart', fingers.slice(0, i + 1), [fingers[i]]));
    fire('touchend', fingers.slice(1), [end]);
  });
}

describe('AttachmentLightbox', () => {
  it('draws the name in place, and the field by its own name when there is none', () => {
    mount([attachment('a1', 'la canilla')]);
    expect(field().value).toBe('la canilla');
    expect(field().placeholder).toBe('Nombre');
    act(() => root?.unmount());
    mount([attachment('a2', '')]);
    expect(field().value).toBe('');
    expect(field().placeholder).toBe('Nombre');
  });

  it('keeps the name on blur, lowercased and trimmed, and only when it changed', () => {
    const one = attachment('a1', 'la canilla');
    mount([one]);
    leave(field());
    expect(onRename).not.toHaveBeenCalled();
    type(field(), '  La Pérdida del baño ');
    leave(field());
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onRename).toHaveBeenCalledWith(one, 'la pérdida del baño');
    expect(field().value).toBe('la pérdida del baño');
    leave(field());
    expect(onRename).toHaveBeenCalledTimes(1);
  });

  it('keeps an emptied name as empty: an attachment may have none', () => {
    const one = attachment('a1', 'la canilla');
    mount([one]);
    type(field(), '   ');
    leave(field());
    expect(onRename).toHaveBeenCalledWith(one, '');
    expect(field().value).toBe('');
  });

  it('Enter leaves the field, keeping the name', () => {
    const one = attachment('a1', '');
    mount([one]);
    type(field(), 'el presupuesto');
    act(() => field().focus());
    press(field(), 'Enter');
    expect(onRename).toHaveBeenCalledWith(one, 'el presupuesto');
  });

  it('leaves the arrows to the caret while the name is being written', () => {
    mount([attachment('a1', ''), attachment('a2', '')]);
    press(field(), 'ArrowRight');
    expect(path()).toBe(`${OWNER_PATH}/a1`);
    press(document.body, 'ArrowRight');
    expect(path()).toBe(`${OWNER_PATH}/a2`);
  });

  it('keeps a name still being typed when the dialog is put away', () => {
    const one = attachment('a1', '');
    mount([one]);
    type(field(), 'la factura');
    const dialog = document.querySelector('dialog');
    if (!dialog) throw new Error('no dialog');
    act(() => {
      dialog.dispatchEvent(new Event('close'));
    });
    expect(onRename).toHaveBeenCalledWith(one, 'la factura');
    expect(path()).toBe(OWNER_PATH);
  });

  it('keeps a name still being typed when moving on to the next attachment', () => {
    const one = attachment('a1', '');
    mount([one, attachment('a2', '')]);
    type(field(), 'la factura');
    press(document.body, 'ArrowRight');
    expect(onRename).toHaveBeenCalledWith(one, 'la factura');
    expect(path()).toBe(`${OWNER_PATH}/a2`);
  });

  it('moves on with a finger swept across', () => {
    const both = [attachment('a1', ''), attachment('a2', '')];
    mount(both);
    drag([{ x: 300, y: 300 }], { x: 200, y: 320 });
    expect(path()).toBe(`${OWNER_PATH}/a2`);
    act(() => root?.unmount());
    mount(both, 1);
    drag([{ x: 200, y: 300 }], { x: 300, y: 280 });
    expect(path()).toBe(`${OWNER_PATH}/a1`);
  });

  it('stays put while a finger scrolls, though it drifts sideways', () => {
    mount([attachment('a1', ''), attachment('a2', '')]);
    drag([{ x: 300, y: 600 }], { x: 220, y: 200 });
    expect(path()).toBe(`${OWNER_PATH}/a1`);
  });

  it('stays put after a pinch', () => {
    mount([attachment('a1', ''), attachment('a2', '')]);
    drag(
      [
        { x: 300, y: 300 },
        { x: 100, y: 300 },
      ],
      { x: 200, y: 300 },
    );
    expect(path()).toBe(`${OWNER_PATH}/a1`);
  });
});
