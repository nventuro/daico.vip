// =============================================================================
// A night of the backup, checked from this machine: the last one (or the one
// named) is fetched from the bucket with the read key in `.env`, opened with
// the identity typed at the prompt, and every count and hash in its manifest
// is verified; then the objects the backup holds are compared with the
// attachment rows the night has and with what the source bucket listed that
// night. Prints counts, and fails on anything wrong.
//
//   npm run backup:check [-- <stamp>]
// =============================================================================
import { PREFIXES, backupBucket } from './lib/backupEnv.mjs';
import { fetchNight, nightStamp } from './lib/nights.mjs';
import { keysUnder } from './lib/s3.mjs';
import { readSecret } from './lib/secret.mjs';
import { problemsOf } from './lib/snapshot.mjs';

const backups = backupBucket();
const stamp = await nightStamp(backups, process.argv[2]);
const identity = await readSecret('Identity (AGE-SECRET-KEY-1…): ');
const night = await fetchNight(backups, identity, stamp);

const problems = problemsOf(night);
const tables = Object.keys(night.manifest.tables).length;
const rows = Object.values(night.tables).reduce((n, list) => n + list.length, 0);
console.log(
  `night ${stamp}: ${tables} tables, ${rows} rows, ${problems.length === 0 ? 'every hash checks' : problems.join('; ')}`,
);

const held = await keysUnder(backups, PREFIXES.objects);
const listed = new Set((night.manifest.objects ?? []).map((object) => object.key));
const rowsWithoutFile = (night.tables['public.attachments'] ?? []).filter(
  (row) => !held.has(row.id),
).length;
const listedNotHeld = [...listed].filter((key) => !held.has(key)).length;
const heldNotListed = [...held].filter((key) => !listed.has(key)).length;
console.log(
  `objects: ${held.size} held, ${rowsWithoutFile} attachment rows without a file, ` +
    `${listedNotHeld} listed at the source but not held, ${heldNotListed} held that the source no longer lists`,
);

process.exit(problems.length === 0 && rowsWithoutFile === 0 && listedNotHeld === 0 ? 0 : 1);
