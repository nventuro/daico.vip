import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { holdUpdates } from '../lib/appUpdate';

interface HiddenFileInputProps {
  /** What the device may offer, e.g. 'image/*' or 'application/pdf'. */
  accept: string;
  multiple?: boolean;
  /** Names the picker for a screen reader. */
  label: string;
  /** The files picked; never empty. */
  onPick: (files: File[]) => void;
  /** Called when the picker was closed without picking, where the browser
   *  says so. */
  onCancel?: () => void;
  /** The visible control: calling `pick` brings the device's picker up. */
  children: (pick: () => void) => ReactNode;
}

/**
 * The device's file picker behind a control of the caller's own. A file input
 * is the only way to bring the picker up, but it draws a control of the
 * browser's that belongs to no screen here, so it is kept off screen and the
 * caller shows whatever it likes.
 */
export default function HiddenFileInput({
  accept,
  multiple = false,
  label,
  onPick,
  onCancel,
  children,
}: HiddenFileInputProps) {
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  // The picker hides the page while it is up, and a build waiting to go in
  // must not take the page then: the pick would come back to nothing.
  const holding = useRef<(() => void) | null>(null);
  const settle = useCallback(() => {
    holding.current?.();
    holding.current = null;
  }, []);

  useEffect(() => {
    if (!input) return;
    const cancelled = () => {
      settle();
      onCancel?.();
    };
    input.addEventListener('cancel', cancelled);
    return () => input.removeEventListener('cancel', cancelled);
  }, [input, onCancel, settle]);

  // A control that goes away holds nothing back.
  useEffect(() => settle, [settle]);

  function pick() {
    holding.current ??= holdUpdates();
    input?.click();
  }

  function picked(e: ChangeEvent<HTMLInputElement>) {
    settle();
    const files = Array.from(e.target.files ?? []);
    // Cleared so picking the same files again still counts as a change.
    e.target.value = '';
    if (files.length > 0) onPick(files);
  }

  return (
    <>
      {children(pick)}
      <input
        ref={setInput}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={picked}
        aria-label={label}
        tabIndex={-1}
        className="sr-only"
      />
    </>
  );
}
