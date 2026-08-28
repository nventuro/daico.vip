import { useEffect, useRef, type RefObject } from 'react';

/**
 * Runs a `<dialog>` as a modal for as long as the calling component is
 * mounted: opens it on mount, keeps the page behind it from scrolling, and
 * calls `onClose` when the browser closes it on its own — Escape, a phone's
 * back gesture — so the caller can unmount it. Returns the ref to put on it.
 */
export function useModalDialog(onClose: () => void): RefObject<HTMLDialogElement | null> {
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

  return ref;
}
