import { useEffect, useRef } from 'react';
import { createInboxKey } from '../lib/householdKey';
import { INBOX_KEY_SPEC } from '../lib/offline/specs';
import { syncAll } from '../lib/offline/sync';
import { isPermanentRowError } from '../lib/refusals';
import { supabase } from '../lib/supabase';
import { useMasterKey } from '../hooks/useMasterKey';
import { useOfflineTable } from '../hooks/useOfflineTable';
import { useOnline } from '../hooks/useOnline';
import { useSyncStatus } from '../hooks/useSyncStatus';

/**
 * Gives the household its inbox key when it has none: the pair the email
 * worker seals a PDF to, made on a device that holds the master key and
 * written straight to the server, as the household key is. Only once a sync
 * has completed here, so an empty local table is known to mean no row on the
 * server; a race with another device is lost gracefully, the row that got
 * there first being the household's. Draws nothing.
 */
export default function InboxKeySetup() {
  const masterKey = useMasterKey();
  const { items, loading } = useOfflineTable(INBOX_KEY_SPEC);
  const online = useOnline();
  const { completedAt } = useSyncStatus();
  const attempted = useRef(false);

  useEffect(() => {
    if (
      masterKey.status !== 'unlocked' ||
      loading ||
      items.length > 0 ||
      !online ||
      completedAt === null ||
      attempted.current
    ) {
      return;
    }
    attempted.current = true;
    const key = masterKey.key;
    void (async () => {
      const pair = await createInboxKey(key);
      const { error } = await supabase.from(INBOX_KEY_SPEC.table).insert(pair);
      // A refusal for good is another device's row already there; anything
      // else may pass next time.
      if (error && !isPermanentRowError(error)) {
        attempted.current = false;
        return;
      }
      await syncAll();
    })();
  }, [masterKey, loading, items.length, online, completedAt]);

  return null;
}
