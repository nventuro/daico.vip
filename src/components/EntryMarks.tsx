import { IconNotes, IconRepeat, type TablerIcon } from '@tabler/icons-react';
import type { EntryMark } from '../types';

const ICONS: Record<EntryMark, { Icon: TablerIcon; label: string }> = {
  comments: { Icon: IconNotes, label: 'Tiene comentarios o adjuntos' },
  repeat: { Icon: IconRepeat, label: 'Se repite' },
};

/** The marks of a listed entry as a row of small icons; nothing when there are none. */
export default function EntryMarks({ marks }: { marks: EntryMark[] | undefined }) {
  if (!marks?.length) return null;
  return (
    <span className="flex shrink-0 items-center gap-1 text-muted">
      {marks.map((mark) => {
        const { Icon, label } = ICONS[mark];
        return <Icon key={mark} size={16} stroke={1.5} aria-label={label} />;
      })}
    </span>
  );
}
