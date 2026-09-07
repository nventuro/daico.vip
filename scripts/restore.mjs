// =============================================================================
// A restore: one night of the backup into an empty project. The target is the
// linked project (`npm run db:link`, then `npm run db:push` for the schema),
// reached with SUPABASE_DB_PASSWORD as every db script is; the night comes
// from the backup bucket with the read key in `.env`, opened with the identity
// typed at the prompt; the files go into the attachments bucket the R2 token
// in `.env` may write. It refuses a target with rows in it, so the linked
// project is never overwritten by mistake, and a target whose applied
// migrations differ from the night's, so no row lands in a column the night
// did not know.
//
// Tables are loaded in an order that satisfies every foreign key, each row
// through jsonb_populate_record, so a column the target has that the night
// lacks takes its default; the auth rows go back under their old ids. The
// whole load is one transaction: a failure leaves the target empty.
//
//   npm run backup:restore [-- <stamp>]
// =============================================================================
import { Client, clientOptions } from './lib/db.mjs';
import { PREFIXES, attachmentsBucket, backupBucket } from './lib/backupEnv.mjs';
import { fetchGuides, fetchNight, nightStamp } from './lib/nights.mjs';
import { keysUnder } from './lib/s3.mjs';
import { readSecret } from './lib/secret.mjs';
import { problemsOf } from './lib/snapshot.mjs';

/** Rows per insert statement. */
const BATCH = 500;
/** Loading the guide images is the one slow statement. */
const STATEMENT_TIMEOUT_MS = 600_000;
const MIGRATIONS_TABLE = 'supabase_migrations.schema_migrations';
const AUTH_TABLES = ['auth.users', 'auth.identities'];

const quoted = (name) => `"${name.replace(/"/g, '""')}"`;
const split = (name) => name.split('.');

function refuse(reason) {
  console.error(`refused: ${reason}`);
  process.exit(1);
}

/** `tables`, every parent ahead of every child that references it. */
async function fkOrder(db, tables) {
  const { rows } = await db.query(
    `select cn.nspname || '.' || c.relname as child, pn.nspname || '.' || p.relname as parent
     from pg_constraint k
     join pg_class c on c.oid = k.conrelid join pg_namespace cn on cn.oid = c.relnamespace
     join pg_class p on p.oid = k.confrelid join pg_namespace pn on pn.oid = p.relnamespace
     where k.contype = 'f'`,
  );
  const wanted = new Set(tables);
  const parents = new Map(tables.map((t) => [t, new Set()]));
  for (const { child, parent } of rows) {
    if (child !== parent && wanted.has(child) && wanted.has(parent)) parents.get(child).add(parent);
  }
  const ordered = [];
  while (ordered.length < tables.length) {
    const ready = tables.filter(
      (t) => !ordered.includes(t) && [...parents.get(t)].every((p) => ordered.includes(p)),
    );
    if (ready.length === 0) throw new Error('the foreign keys form a cycle');
    ordered.push(...ready);
  }
  return ordered;
}

/** The columns a row can be given: the real, ungenerated ones. */
async function columnsOf(db, schema, table) {
  const { rows } = await db.query(
    `select attname from pg_attribute
     where attrelid = format('%I.%I', $1::text, $2::text)::regclass
       and attnum > 0 and not attisdropped and attgenerated = ''`,
    [schema, table],
  );
  return rows.map((r) => r.attname);
}

async function isEmpty(db, name) {
  const [schema, table] = split(name);
  const { rows } = await db.query(
    `select exists (select 1 from ${quoted(schema)}.${quoted(table)}) as any`,
  );
  return !rows[0].any;
}

async function load(db, name, rows) {
  if (rows.length === 0) return;
  const [schema, table] = split(name);
  const present = new Set(rows.flatMap((row) => Object.keys(row)));
  const columns = (await columnsOf(db, schema, table)).filter((c) => present.has(c));
  const list = columns.map(quoted).join(', ');
  const target = `${quoted(schema)}.${quoted(table)}`;
  for (let at = 0; at < rows.length; at += BATCH) {
    await db.query(
      `insert into ${target} (${list}) select ${list} from jsonb_populate_recordset(null::${target}, $1::jsonb)`,
      [JSON.stringify(rows.slice(at, at + BATCH))],
    );
  }
}

const backups = backupBucket();
const stamp = await nightStamp(backups, process.argv[2]);
const identity = await readSecret('Identity (AGE-SECRET-KEY-1…): ');
const night = await fetchNight(backups, identity, stamp);
const nightProblems = problemsOf(night);
if (nightProblems.length > 0) refuse(`night ${stamp} is not whole: ${nightProblems.join('; ')}`);
const guides = await fetchGuides(backups, identity, night.manifest.guides);
const guideProblems = problemsOf(guides);
if (guideProblems.length > 0) refuse(`the guides file is not whole: ${guideProblems.join('; ')}`);

const tables = { ...night.tables, ...guides.tables };
delete tables[MIGRATIONS_TABLE];
const publicTables = Object.keys(tables).filter((name) => name.startsWith('public.'));

const db = new Client(clientOptions({ statement_timeout: STATEMENT_TIMEOUT_MS }));
await db.connect();
try {
  const { rows: applied } = await db.query(
    `select version from ${MIGRATIONS_TABLE} order by version`,
  );
  const target = applied.map((r) => r.version);
  const wanted = [...(night.manifest.migrations ?? [])].sort();
  if (JSON.stringify(target) !== JSON.stringify(wanted)) {
    refuse(
      `the target has ${target.length} migrations applied and the night ${wanted.length}; push the same ones first`,
    );
  }
  for (const name of [...publicTables, ...AUTH_TABLES]) {
    if (!(await isEmpty(db, name)))
      refuse(`${name} has rows; a restore goes into an empty project`);
  }

  const order = [...(await fkOrder(db, publicTables)), ...AUTH_TABLES];
  await db.query('begin');
  try {
    for (const name of order) await load(db, name, tables[name]);
    await db.query('commit');
  } catch (error) {
    await db.query('rollback');
    throw error;
  }
  const rows = order.reduce((n, name) => n + tables[name].length, 0);
  console.log(`loaded ${order.length} tables, ${rows} rows`);
} finally {
  await db.end();
}

const attachments = attachmentsBucket();
const inPlace = await keysUnder(attachments, '');
let copied = 0;
let missing = 0;
for (const { key } of night.manifest.objects ?? []) {
  if (inPlace.has(key)) continue;
  const bytes = await backups.get(`${PREFIXES.objects}${key}`);
  if (bytes === null) {
    missing += 1;
    continue;
  }
  await attachments.put(key, bytes);
  copied += 1;
}
console.log(
  `copied ${copied} objects into the attachments bucket, ${missing} the backup did not hold`,
);
process.exit(missing === 0 ? 0 : 1);
