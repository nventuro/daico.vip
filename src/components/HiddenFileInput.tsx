import { useState, type ChangeEvent, type ReactNode } from 'react';

interface HiddenFileInputProps {
  /** What the device may offer, e.g. 'image/*' or 'application/pdf'. */
  accept: string;
  multiple?: boolean;
  /** Names the picker for a screen reader. */
  label: string;
  /** The files picked; never empty. */
  onPick: (files: File[]) => void;
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
  children,
}: HiddenFileInputProps) {
  const [input, setInput] = useState<HTMLInputElement | null>(null);

  function picked(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    // Cleared so picking the same files again still counts as a change.
    e.target.value = '';
    if (files.length > 0) onPick(files);
  }

  return (
    <>
      {children(() => input?.click())}
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
