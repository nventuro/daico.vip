import { IconCheck } from '@tabler/icons-react';

/** The mark that says an item is done: a square, filled in the app's colour
 *  when checked. Purely visual — the row it sits in is the control. */
export default function CheckSquare({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center border-2 transition-colors ${
        checked
          ? 'border-(--app) bg-(--app) text-on-primary'
          : 'border-neutral-hover text-transparent'
      }`}
    >
      <IconCheck size={14} stroke={3} />
    </span>
  );
}
