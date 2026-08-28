import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalDialogProps {
  /** Called when the browser closes the dialog on its own — Escape, a phone's
   *  back gesture — so the caller can unmount it. */
  onClose: () => void;
  className: string;
  children: ReactNode;
}

/**
 * A `<dialog>` shown as a modal for as long as it is mounted, with the page
 * behind it kept from scrolling. It is rendered at the end of the document,
 * not where the caller sits: a caller inside a form would otherwise put the
 * dialog's own form inside that one, and the browser submits a form nested
 * so as a page load.
 */
export default function ModalDialog({ onClose, className, children }: ModalDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
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
    <dialog ref={ref} className={className}>
      {children}
    </dialog>,
    document.body,
  );
}
