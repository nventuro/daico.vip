// =============================================================================
// The email worker's database credential, end to end: sets (or rotates) the
// password of `trip_inbox_writer`, the role the worker connects as, and puts
// it where the worker reaches it — a Cloudflare Hyperdrive configuration,
// created the first time and updated after, its id written into
// `worker/wrangler.jsonc`. The migration creates the role without a password
// on purpose, so no secret lands in the repo, and the password is never
// printed: it goes from this process to the database and to Cloudflare.
//
// The worker reaches the database through Hyperdrive rather than on its own:
// Workers verify TLS only against public roots, and the pooler's certificate
// chains to Supabase's own, so Hyperdrive is what holds the connection string
// and verifies that chain against the uploaded `supabase/ca.crt`
// (`npm run worker:cert`, which prints the certificate id).
//
//   the first time:  npm run worker:hyperdrive -- <certificate id>
//   rotating:        npm run worker:hyperdrive
// =============================================================================
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Client, clientOptions, connectionString, root } from './lib/db.mjs';

const ROLE = 'trip_inbox_writer';
const HYPERDRIVE_NAME = 'trips-inbox';
const WORKER_DIR = path.join(root, 'worker');
const WRANGLER_BIN = path.join(WORKER_DIR, 'node_modules/.bin/wrangler');
const WRANGLER_CONFIG = path.join(WORKER_DIR, 'wrangler.jsonc');
// The binding's id in wrangler.jsonc; all zeros until the configuration exists.
const HYPERDRIVE_ID = /("binding":\s*"HYPERDRIVE",\s*"id":\s*")([0-9a-f]{32})(")/;
const PLACEHOLDER_ID = '0'.repeat(32);

function wrangler(args) {
  const out = execFileSync(WRANGLER_BIN, args, {
    cwd: WORKER_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  process.stdout.write(out);
  return out;
}

const config = fs.readFileSync(WRANGLER_CONFIG, 'utf8');
const bound = config.match(HYPERDRIVE_ID);
if (!bound) throw new Error('no HYPERDRIVE binding with an id in worker/wrangler.jsonc');
const existingId = bound[2] === PLACEHOLDER_ID ? null : bound[2];
const certificateId = process.argv[2];
if (existingId === null && !certificateId) {
  throw new Error('first run: pass the certificate id `npm run worker:cert` printed');
}

// base64url of 32 random bytes: long enough, and made only of characters that
// need no quoting, which is what lets the ALTER ROLE below be a plain string.
const password = randomBytes(32).toString('base64url');
if (!/^[A-Za-z0-9_-]+$/.test(password)) throw new Error('unexpected password alphabet');

const client = new Client(clientOptions({ statement_timeout: 15000 }));
await client.connect();
await client.query(`alter role ${ROLE} with login password '${password}'`);
await client.end();
console.log(`Password of ${ROLE} set.`);

// The pooler URL names the project (`postgres.<ref>`); the worker's role
// connects through the same pooler as `trip_inbox_writer.<ref>`, in session
// mode — the port the linked URL already carries.
const url = new URL(connectionString());
const ref = url.username.replace(/^postgres\./, '');
url.username = `${ROLE}.${ref}`;
url.password = password;

if (existingId === null) {
  const out = wrangler([
    'hyperdrive',
    'create',
    HYPERDRIVE_NAME,
    '--connection-string',
    url.toString(),
    '--ca-certificate-id',
    certificateId,
    '--sslmode',
    'verify-full',
    // The members read is the gate: never served from a cache.
    '--caching-disabled',
  ]);
  const id = out.match(/config: ([0-9a-f]{32})/)?.[1];
  if (!id) {
    throw new Error(
      'could not read the new Hyperdrive id; put it in worker/wrangler.jsonc by hand',
    );
  }
  fs.writeFileSync(WRANGLER_CONFIG, config.replace(HYPERDRIVE_ID, `$1${id}$3`));
  console.log(
    `Hyperdrive id ${id} written to worker/wrangler.jsonc — run npm run worker:deploy again.`,
  );
} else {
  wrangler(['hyperdrive', 'update', existingId, '--connection-string', url.toString()]);
  console.log('Hyperdrive configuration updated; the deployed worker uses it from now on.');
}
