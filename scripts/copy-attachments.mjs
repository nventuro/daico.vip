// =============================================================================
// The one move of the attachment files: every object in the Supabase Storage
// bucket copied into the R2 bucket the files worker serves, then read back
// and compared byte for byte. Nothing is skipped and nothing is deleted, so
// it can run again at any time — and it should, once every device is on the
// build that writes to R2, to carry over what a device still on the old one
// sent to the old bucket meanwhile.
//
// What it holds: the project's secret key, which reads the old bucket past
// every policy, and the Cloudflare token, which writes the new one through
// wrangler. The objects are ciphertext to it; it prints their ids and counts
// and never their bytes.
//
//   npm run files:copy
// =============================================================================
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

/** The bucket on both sides. */
const BUCKET = 'attachments';
/** Objects the old bucket lists per page. */
const LIST_PAGE = 1000;
/** What every object is stored as: an opaque blob, the real type in its row. */
const OBJECT_TYPE = 'application/octet-stream';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wrangler = path.join(root, 'worker/node_modules/.bin/wrangler');

/** The project's address, from what `supabase link` wrote. */
function supabaseUrl() {
  const file = path.join(root, 'supabase/.temp/project-ref');
  if (!fs.existsSync(file)) throw new Error(`${file} missing — run \`npm run db:link\` first`);
  return `https://${fs.readFileSync(file, 'utf8').trim()}.supabase.co`;
}

function env(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

/** Run wrangler in the worker's directory, failing loudly. */
function run(args) {
  const { status, stderr, error } = spawnSync(wrangler, args, {
    cwd: path.join(root, 'worker'),
    stdio: ['ignore', 'ignore', 'pipe'],
    encoding: 'utf8',
  });
  if (error) throw error;
  if (status !== 0) throw new Error(`wrangler ${args.slice(0, 3).join(' ')} failed:\n${stderr}`);
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function main() {
  const storage = createClient(supabaseUrl(), env('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from(BUCKET);
  env('CLOUDFLARE_API_TOKEN');

  const names = [];
  for (let offset = 0; ; offset += LIST_PAGE) {
    const { data, error } = await storage.list('', { limit: LIST_PAGE, offset });
    if (error) throw new Error(`listing the old bucket: ${error.message}`);
    names.push(...data.map((object) => object.name));
    if (data.length < LIST_PAGE) break;
  }
  console.log(`${names.length} object(s) in the old bucket`);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'daico-files-'));
  const mismatched = [];
  try {
    for (const [i, name] of names.entries()) {
      const { data, error } = await storage.download(name);
      if (error) throw new Error(`downloading ${name}: ${error.message}`);
      const bytes = Buffer.from(await data.arrayBuffer());
      const sent = path.join(dir, 'sent');
      const got = path.join(dir, 'got');
      fs.writeFileSync(sent, bytes);
      run([
        'r2',
        'object',
        'put',
        `${BUCKET}/${name}`,
        '--file',
        sent,
        '--content-type',
        OBJECT_TYPE,
        '--remote',
      ]);
      run(['r2', 'object', 'get', `${BUCKET}/${name}`, '--file', got, '--remote']);
      const same = sha256(fs.readFileSync(got)) === sha256(bytes);
      if (!same) mismatched.push(name);
      console.log(
        `${i + 1}/${names.length} ${name} ${bytes.length} bytes ${same ? 'ok' : 'MISMATCH'}`,
      );
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  if (mismatched.length > 0) {
    console.error(`${mismatched.length} object(s) read back differently: ${mismatched.join(', ')}`);
    process.exit(1);
  }
  console.log(`${names.length} object(s) copied and verified`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
