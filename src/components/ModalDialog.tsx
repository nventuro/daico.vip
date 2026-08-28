import { useContext, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HueContext } from '../context/hueContext';
import { hueStyle } from '../shell/hue';

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
 * so as a page load. Being outside the app's frame, it is painted in the
 * app's hue on its own, so its chips and check squares show.
 */
export default function ModalDialog({ onClose, className, children }: ModalDialogProps) {
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
    <dialog ref={ref} className={className} style={hueStyle(hue)}>
      {children}
    </dialog>,
    document.body,
  );
}
