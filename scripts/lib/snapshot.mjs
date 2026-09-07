// =============================================================================
// The backup's file format: one night's tables, or the guides', as a stream
// of JSON lines — a manifest first, then one line per row — gzipped and
// sealed with age to a recipient whose identity the job never holds. The
// manifest carries a count and a hash per table, so a file can be checked
// without a database, and what a restore needs to know before it writes.
// =============================================================================
import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import { Decrypter, Encrypter } from 'age-encryption';

/** Bumped when the lines change shape; a reader refuses a later one. */
export const SNAPSHOT_VERSION = 1;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** The key a table's rows are put in order by, so two snapshots of the same
 *  rows are the same bytes: the row's id, a migration's version, or the row
 *  itself for a table with neither. */
const rowKey = (row) => String(row.id ?? row.version ?? JSON.stringify(row));

/** A table's rows in their fixed order. */
export function orderedRows(rows) {
  return [...rows].sort((a, b) => {
    const [x, y] = [rowKey(a), rowKey(b)];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

/** The hash of a table's rows, in their fixed order. */
export function tableDigest(rows) {
  const hash = createHash('sha256');
  for (const row of orderedRows(rows)) hash.update(`${JSON.stringify(row)}\n`);
  return hash.digest('hex');
}

/**
 * A manifest for `tables` (`{ 'public.chores': rows, … }`): the version, the
 * stamp, a count and a hash per table, and whatever else the caller has to
 * say — the object listing and the migrations for a night, the digest for
 * the guides.
 */
export function manifestFor(stamp, tables, extra = {}) {
  return {
    version: SNAPSHOT_VERSION,
    stamp,
    tables: Object.fromEntries(
      Object.entries(tables).map(([name, rows]) => [
        name,
        { rows: rows.length, sha256: tableDigest(rows) },
      ]),
    ),
    ...extra,
  };
}

/** The plaintext of a snapshot: the manifest line, then the rows, gzipped. */
export function encodeSnapshot(manifest, tables) {
  const lines = [JSON.stringify({ manifest })];
  for (const [table, rows] of Object.entries(tables)) {
    for (const row of orderedRows(rows)) lines.push(JSON.stringify({ table, row }));
  }
  return new Uint8Array(gzipSync(encoder.encode(`${lines.join('\n')}\n`)));
}

/** What `encodeSnapshot` wrote: the manifest and the tables, every table the
 *  manifest names present even when it has no rows. */
export function decodeSnapshot(bytes) {
  const lines = decoder.decode(gunzipSync(bytes)).split('\n');
  const first = lines.shift();
  const { manifest } = JSON.parse(first);
  if (manifest?.version === undefined) throw new Error('not a snapshot: no manifest');
  if (manifest.version > SNAPSHOT_VERSION) {
    throw new Error(`snapshot version ${manifest.version} is newer than this build reads`);
  }
  const tables = Object.fromEntries(Object.keys(manifest.tables).map((name) => [name, []]));
  for (const line of lines) {
    if (line === '') continue;
    const { table, row } = JSON.parse(line);
    (tables[table] ??= []).push(row);
  }
  return { manifest, tables };
}

/** What is wrong with a decoded snapshot, table by table; nothing when it is
 *  whole. */
export function problemsOf({ manifest, tables }) {
  const problems = [];
  for (const [name, expected] of Object.entries(manifest.tables)) {
    const rows = tables[name] ?? [];
    if (rows.length !== expected.rows) {
      problems.push(`${name}: ${rows.length} rows, the manifest says ${expected.rows}`);
    } else if (tableDigest(rows) !== expected.sha256) {
      problems.push(`${name}: the rows do not hash to what the manifest says`);
    }
  }
  return problems;
}

/** `bytes` sealed to `recipient` (`age1…`). */
export async function seal(recipient, bytes) {
  const encrypter = new Encrypter();
  encrypter.addRecipient(recipient);
  return encrypter.encrypt(bytes);
}

/** What was sealed, opened with `identity` (`AGE-SECRET-KEY-1…`). */
export async function open(identity, bytes) {
  const decrypter = new Decrypter();
  decrypter.addIdentity(identity);
  return decrypter.decrypt(bytes, 'uint8array');
}
