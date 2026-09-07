// =============================================================================
// A night's file, found and opened: what the check and the restore start
// from. A night is named by its stamp; the last one is the one meant when
// none is named.
// =============================================================================
import { PREFIXES } from './backupEnv.mjs';
import { keysUnder } from './s3.mjs';
import { decodeSnapshot, open } from './snapshot.mjs';

const SEALED = '.age';

/** The stamp of the night asked for, or of the last one in the bucket. */
export async function nightStamp(backups, wanted) {
  const stamps = [...(await keysUnder(backups, PREFIXES.daily))]
    .filter((key) => key.endsWith(SEALED))
    .map((key) => key.slice(0, -SEALED.length))
    .sort();
  if (stamps.length === 0) throw new Error('the bucket holds no night yet');
  if (wanted !== undefined && !stamps.includes(wanted)) {
    throw new Error(`no night ${wanted} in the bucket; the last is ${stamps.at(-1)}`);
  }
  return wanted ?? stamps.at(-1);
}

/** The night's manifest and tables, opened with `identity`. */
export async function fetchNight(backups, identity, stamp) {
  const sealed = await backups.get(`${PREFIXES.daily}${stamp}${SEALED}`);
  if (sealed === null) throw new Error(`night ${stamp} is not in the bucket`);
  return decodeSnapshot(await open(identity, sealed));
}

/** The guides file a night names, opened with `identity`. */
export async function fetchGuides(backups, identity, digest) {
  const sealed = await backups.get(`${PREFIXES.guides}${digest}${SEALED}`);
  if (sealed === null)
    throw new Error(`the guides file ${digest} the night names is not in the bucket`);
  return decodeSnapshot(await open(identity, sealed));
}
