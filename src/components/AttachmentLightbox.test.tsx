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
});
