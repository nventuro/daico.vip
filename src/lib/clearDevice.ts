// =============================================================================
// What a device forgets once its session has ended: the local tables, the files
// kept beside them, the master key, the sync stamp and the cached membership
// verdict. It runs however the session ended — the button, a token refresh that
// failed, a sign-out from elsewhere — because a phone is shared and what stays
// behind is the household's documents.
//
// Best effort, step by step: a step that fails is said out loud and the others
// still run.
// =============================================================================
import { clearMasterKey } from './masterKeyStore';
import { clearAll } from './offline/engine';
import { resetSyncStatus } from './offline/sync';
import { forgetVerdict } from './membershipCache';

async function forget(what: string, run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (err) {
    console.warn(`[daico] ${what} could not be cleared on sign-out:`, err);
  }
}

/** Forget everything this device holds for the session that has just ended.
 *  `userId` is whose session it was, null when the device never knew. */
export async function clearDevice(userId: string | null): Promise<void> {
  if (userId !== null) forgetVerdict(userId);
  resetSyncStatus();
  // clearAll() is what spins up the local database worker; importing it does not.
  await forget('the local data', clearAll);
  await forget('the master key', clearMasterKey);
}
