import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { lowercaseTrimmed } from '../utils/textUtils';
import IconButton from './IconButton';

interface EntryHeadProps {
  /** The title as stored: what the heading starts from and comes back to
   *  when it is left empty. */
  title: string;
  /** Called on blur with the title as it will be kept — trimmed, and
   *  lower-cased unless the entry takes capitals — and never with an empty
   *  one, nor with one that has not changed. */
  onTitle: (title: string) => void;
  /** Whether the keyboard capitalises what is typed, and the title keeps it:
   *  an entry named after a place takes capitals, the lower-case titles most
   *  lists are kept in do not. */
  autoCapitalize?: 'none' | 'sentences';
  /** The line under the title: when it was last written, say. */
  subtitle?: ReactNode;
  /** A row of chips under it: the group an entry is filed under, its class. */
  chips?: ReactNode;
  /** What the trash does; left out for an entry that is never deleted here. */
  onDelete?: () => void;
  /** What the trash is called, e.g. "Eliminar nota". */
  deleteLabel?: string;
  /** Enter in the title, for moving the caret on to the text under it. */
  onEnter?: () => void;
}

/** The title, styled as the page's heading and drawn as nothing else. */
const TITLE_CLASS =
  'w-full min-w-0 border-0 bg-transparent p-0 font-display text-2xl font-black tracking-tight text-on-surface outline-none placeholder:text-muted';

/**
 * The head of an entry's page: its title as the heading, written in place,
 * with what goes under it and the trash at the right. The title is kept on
 * blur; emptied, it comes back as it was.
 */
export default function EntryHead({
  title,
  onTitle,
  autoCapitalize = 'none',
  subtitle,
  chips,
  onDelete,
  deleteLabel = 'Eliminar',
  onEnter,
}: EntryHeadProps) {
  const [draft, setDraft] = useState(title);

  function commit() {
    const kept = autoCapitalize === 'none' ? lowercaseTrimmed(draft) : draft.trim();
    if (kept === '') {
      setDraft(title);
      return;
    }
    setDraft(kept);
    if (kept !== title) onTitle(kept);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    e.currentTarget.blur();
    onEnter?.();
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          aria-label="Título"
          placeholder="Título"
          enterKeyHint="next"
          autoCapitalize={autoCapitalize}
          className={TITLE_CLASS}
        />
        {subtitle !== undefined && <span className="text-xs text-muted">{subtitle}</span>}
        {chips !== undefined && <div className="mt-1.5 flex flex-wrap gap-2">{chips}</div>}
      </div>
      {onDelete && <IconButton label={deleteLabel} icon={IconTrash} onClick={onDelete} />}
    </div>
  );
}
