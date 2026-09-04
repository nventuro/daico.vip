import { useContext, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HueContext, hueStyle } from './hue';

/**
 * How much of the screen the dialog takes. `sheet`: the whole screen on a
 * phone, a panel on a wider one — for something to fill in. `confirm`: a small
 * box in the middle, for a question. `full`: the whole screen at any width,
 * dark, for looking at a picture.
 */
export type DialogLayout = 'sheet' | 'confirm' | 'full';

const LAYOUT_CLASS: Record<DialogLayout, string> = {
  sheet:
    'fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-surface p-0 text-on-surface backdrop:bg-on-surface/50 sm:m-auto sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-lg sm:border sm:border-border',
  confirm:
    'm-auto w-[calc(100%-2rem)] max-w-sm border border-border bg-surface p-4 text-on-surface backdrop:bg-on-surface/50',
  full: 'fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-surface-inverse p-0 text-on-surface-inverse backdrop:bg-transparent',
};

interface ModalDialogProps {
  /** Called when the browser closes the dialog on its own — Escape, a phone's
   *  back gesture — so the caller can unmount it. */
  onClose: () => void;
  layout: DialogLayout;
  children: ReactNode;
}

/**
 * A `<dialog>` shown as a modal for as long as it is mounted, with the page
 * behind it kept from scrolling. It is rendered at the end of the document,
 * not where the caller sits: a caller inside a form would otherwise put the
 * dialog's own form inside that one, and the browser submits a form nested
 * so as a page load. Being outside the app's frame, it is painted in the
 * app's hue on its own, so its chips and check squares show.
 */
export default function ModalDialog({ onClose, layout, children }: ModalDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const hue = useContext(HueContext);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    // Opening a modal puts the focus on the first control in it. In one that
    // is filled in that is the field, where the focus is the caret and
    // belongs; in one that asks a question it is the first answer, which the
    // browser then draws outlined — the focus came from a field holding a
    // caret, and it carries that over — so the answer reads as already
    // chosen. Only a control that is typed into keeps it.
    const focused = document.activeElement;
    if (!(focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement)) {
      dialog.focus();
    }
    const closed = () => onCloseRef.current();
    dialog.addEventListener('close', closed);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.removeEventListener('close', closed);
      document.body.style.overflow = overflow;
    };
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      // Focusable so the dialog itself can hold the focus, and drawn without
      // the ring that would then be around the whole box.
      tabIndex={-1}
      className={`${LAYOUT_CLASS[layout]} outline-none`}
      style={hueStyle(hue)}
    >
      {children}
    </dialog>,
    document.body,
  );
}
