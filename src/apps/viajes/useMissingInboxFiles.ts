import { useEffect, useMemo, useState } from 'react';
import * as engine from '../../lib/offline/engine';
import { INBOX_FILES } from '../../lib/offline/localTables';
import { heldInboxFiles } from './inboxFiles';

/**
 * Which of the staged files a group lists this device still lacks: null
 * until its copies have been read, then kept current as files come in with
 * a sync.
 */
export function useMissingInboxFiles(ids: string[]): string[] | null {
  const [missing, setMissing] = useState<string[] | null>(null);
  // The list is rebuilt on every render; what it says is what matters.
  const key = ids.join(' ');
  const wanted = useMemo(() => (key === '' ? [] : key.split(' ')), [key]);

  useEffect(() => {
    let active = true;
    const read = async () => {
      const held = await heldInboxFiles(wanted);
      if (active) setMissing(wanted.filter((id) => !held.has(id)));
    };
    void read();
    const unsubscribe = engine.subscribe(INBOX_FILES.table, () => void read());
    return () => {
      active = false;
      unsubscribe();
    };
  }, [wanted]);

  return missing;
}
