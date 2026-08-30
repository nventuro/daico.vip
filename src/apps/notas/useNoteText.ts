import { useEffect, useState } from 'react';
import type { Note } from '../../lib/offline/specs';
import { useMasterKey } from '../../hooks/useMasterKey';
import { errorMessage } from '../../utils/textUtils';
import { openBody } from './body';

interface NoteText {
  /** What the note says; undefined while its body is still being opened. */
  text: string | undefined;
  error: string | null;
}

const NOT_OPEN: NoteText = { text: undefined, error: null };

/** The version of a note a body was opened from: a note that is edited, here
 *  or on another device, is a new one to open. */
function versionOf(note: Note): string {
  return `${note.id}:${note.updated_at}`;
}

/**
 * What a note says, opened with the household's master key. Undefined until it
 * is open — reading a note is decrypting it — and again for a note whose body
 * has not been opened yet, so a screen never shows one note's body under
 * another's title.
 */
export function useNoteText(note: Note | undefined): NoteText {
  const masterKey = useMasterKey();
  const [opened, setOpened] = useState<(NoteText & { version: string }) | null>(null);

  const version = note && versionOf(note);
  const body = note?.body;
  const wrappedKey = note?.wrapped_key;

  useEffect(() => {
    if (version === undefined || body === undefined || wrappedKey === undefined) return;
    if (masterKey.status !== 'unlocked') return;
    let active = true;
    openBody(masterKey.key, { body, wrapped_key: wrappedKey }).then(
      (text) => {
        if (active) setOpened({ version, text, error: null });
      },
      (e: unknown) => {
        if (active) setOpened({ version, text: undefined, error: errorMessage(e) });
      },
    );
    return () => {
      active = false;
    };
  }, [version, body, wrappedKey, masterKey]);

  return opened !== null && opened.version === version ? opened : NOT_OPEN;
}
