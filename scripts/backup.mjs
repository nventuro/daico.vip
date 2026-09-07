// =============================================================================
// The nightly backup: everything the household keeps, read once and written
// sealed where nothing here can delete it. Runs on GitHub Actions on a
// schedule (`.github/workflows/backup.yml`) and by hand from `.env`
// (`npm run backup:run`), with these in its environment:
//
//   BACKUP_DATABASE_URL    the database, as backup_reader — a role that can
//                          call three functions and touch nothing else
//   BACKUP_AGE_RECIPIENT   the public key the night's files are sealed to
//   R2_*                   the attachments bucket, with a read-only token
//   B2_*                   the backup bucket, with a key that lists and
//                          writes and cannot delete
//
// In order: every public table but the guides', the two auth tables and the
// migrations list, in one repeatable-read transaction; the guide tables only
// when their digest says they changed since the file under it was written;
// the night's file up, twice on the month's first run; then every object of
// the attachments bucket the backup does not hold yet, one at a time; and
// last, well or not, one row of backup_runs, which is what Ajustes shows.
//
// Prints counts and nothing else: the runner's log is public.
// =============================================================================
import { createHash } from 'node:crypto';
import { Client, tlsOptions } from './lib/db.mjs';
import {
  GUIDE_TABLES,
  PREFIXES,
  attachmentsBucket,
  backupBucket,
  required,
  stampOf,
} from './lib/backupEnv.mjs';
import { keysUnder } from './lib/s3.mjs';
import { encodeSnapshot, manifestFor, seal } from './lib/snapshot.mjs';

/** The tables outside public a restore needs: a checkup or a study is keyed
 *  on its owner's user id. */
const AUTH_TABLES = [
  ['auth', 'users'],
  ['auth', 'identities'],
];
/** What a restore checks its target against. */
const MIGRATIONS_TABLE = ['supabase_migrations', 'schema_migrations'];
/** Reading the guide images is the one slow statement. */
const STATEMENT_TIMEOUT_MS = 120_000;

const qualified = (schema, table) => `${schema}.${table}`;
const countRows = (tables) => Object.values(tables).reduce((n, rows) => n + rows.length, 0);

function connect(url) {
  return new Client({
    connectionString: url,
    ssl: tlsOptions(),
    statement_timeout: STATEMENT_TIMEOUT_MS,
  });
}

async function rowsOf(db, schema, table) {
  const { rows } = await db.query('select private.backup_rows($1, $2) as row', [schema, table]);
  return rows.map((r) => r.row);
}

/** Every base table in public, from the catalog, which any role may read. */
async function publicTables(db) {
  const { rows } = await db.query(
    `select c.relname as name
     from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p') order by 1`,
  );
  return rows.map((r) => r.name);
}

/** One digest over the tables' own, so the guides are one file under one name. */
async function digestOf(db, tables) {
  const hash = createHash('sha256');
  for (const table of tables) {
    const { rows } = await db.query('select private.backup_digest($1, $2) as digest', [
      'public',
      table,
    ]);
    hash.update(`${table}:${rows[0].digest}\n`);
  }
  return hash.digest('hex');
}

async function record(url, run) {
  const db = connect(url);
  await db.connect();
  try {
    await db.query('select private.record_backup($1)', [JSON.stringify(run)]);
  } finally {
    await db.end();
  }
}

const message = (error) => (error instanceof Error ? error.message : String(error));

async function main() {
  const started = new Date();
  const stamp = stampOf(started);
  const env = required(['BACKUP_DATABASE_URL', 'BACKUP_AGE_RECIPIENT']);
  const source = attachmentsBucket();
  const destination = backupBucket();
  const run = {
    started_at: started.toISOString(),
    finished_at: null,
    ok: false,
    stage: 'tables',
    rows_read: 0,
    objects_copied: 0,
    objects_total: 0,
    bytes_sent: 0,
  };
  let tables = 0;
  let guidesWritten = false;
  let db = null;
  try {
    // What the destination already holds, asked before the database is
    // opened, so the transaction below is as short as the reading.
    const guidesHeld = await keysUnder(destination, PREFIXES.guides);
    const month = stamp.slice(0, 6);
    const monthHeld = [...(await keysUnder(destination, PREFIXES.monthly))].some((key) =>
      key.startsWith(month),
    );
    const objectsHeld = await keysUnder(destination, PREFIXES.objects);

    db = connect(env.BACKUP_DATABASE_URL);
    await db.connect();
    await db.query('begin isolation level repeatable read read only');
    const nightly = {};
    for (const table of (await publicTables(db)).filter((t) => !GUIDE_TABLES.includes(t))) {
      nightly[qualified('public', table)] = await rowsOf(db, 'public', table);
    }
    for (const [schema, table] of [...AUTH_TABLES, MIGRATIONS_TABLE]) {
      nightly[qualified(schema, table)] = await rowsOf(db, schema, table);
    }
    tables = Object.keys(nightly).length;
    run.rows_read = countRows(nightly);

    run.stage = 'guides';
    const guidesDigest = await digestOf(db, GUIDE_TABLES);
    let guides = null;
    if (!guidesHeld.has(`${guidesDigest}.age`)) {
      guides = {};
      for (const table of GUIDE_TABLES)
        guides[qualified('public', table)] = await rowsOf(db, 'public', table);
      tables += GUIDE_TABLES.length;
      run.rows_read += countRows(guides);
    }
    await db.query('commit');
    await db.end();
    db = null;

    run.stage = 'objects';
    const listing = [];
    for await (const object of source.list('')) listing.push(object);
    run.objects_total = listing.length;

    run.stage = 'upload';
    const migrations = nightly[qualified(...MIGRATIONS_TABLE)].map((row) => row.version).sort();
    const manifest = manifestFor(stamp, nightly, {
      kind: 'nightly',
      guides: guidesDigest,
      objects: listing,
      migrations,
    });
    const night = await seal(env.BACKUP_AGE_RECIPIENT, encodeSnapshot(manifest, nightly));
    await destination.put(`${PREFIXES.daily}${stamp}.age`, night);
    run.bytes_sent += night.length;
    if (!monthHeld) {
      await destination.put(`${PREFIXES.monthly}${stamp}.age`, night);
      run.bytes_sent += night.length;
    }
    if (guides !== null) {
      const file = await seal(
        env.BACKUP_AGE_RECIPIENT,
        encodeSnapshot(
          manifestFor(stamp, guides, { kind: 'guides', digest: guidesDigest }),
          guides,
        ),
      );
      await destination.put(`${PREFIXES.guides}${guidesDigest}.age`, file);
      run.bytes_sent += file.length;
      guidesWritten = true;
    }

    run.stage = 'objects';
    for (const { key } of listing) {
      if (objectsHeld.has(key)) continue;
      const bytes = await source.get(key);
      // Gone since the listing: the app's sweep took it, and a file with no
      // row is nothing to keep.
      if (bytes === null) continue;
      await destination.put(`${PREFIXES.objects}${key}`, bytes);
      run.objects_copied += 1;
      run.bytes_sent += bytes.length;
    }
    run.ok = true;
    run.stage = '';
  } catch (error) {
    console.error(`failed at ${run.stage}: ${message(error)}`);
  } finally {
    if (db !== null) await db.end().catch(() => {});
  }

  run.finished_at = new Date().toISOString();
  try {
    await record(env.BACKUP_DATABASE_URL, run);
  } catch (error) {
    console.error(`could not record the run: ${message(error)}`);
    process.exit(1);
  }
  const seconds = Math.round((Date.parse(run.finished_at) - started.getTime()) / 1000);
  console.log(
    `${run.ok ? 'backed up' : 'failed'}: ${tables} tables, ${run.rows_read} rows, ` +
      `guides ${guidesWritten ? 'written' : 'unchanged'}, ` +
      `${run.objects_copied} of ${run.objects_total} objects copied, ${run.bytes_sent} bytes sent, ${seconds}s`,
  );
  process.exit(run.ok ? 0 : 1);
}

await main();
