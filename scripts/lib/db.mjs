// Connection to the project's Postgres for maintenance scripts: password from
// `.env` (SUPABASE_DB_PASSWORD), pooler URL from the file `supabase link` writes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(root, 'node_modules/'));
export const { Client } = require('pg');

function readPassword() {
  if (process.env.SUPABASE_DB_PASSWORD) return process.env.SUPABASE_DB_PASSWORD.trim();
  const env = fs.readFileSync(path.join(root, '.env'), 'utf8');
  const m = env.match(/^SUPABASE_DB_PASSWORD=(.*)$/m);
  if (!m) throw new Error('SUPABASE_DB_PASSWORD not found in .env');
  return m[1].trim();
}

/** The pooler connection string with the database password filled in. */
export function connectionString() {
  const file = path.join(root, 'supabase/.temp/pooler-url');
  if (!fs.existsSync(file)) {
    throw new Error('supabase/.temp/pooler-url missing — run `npm run db:link` first');
  }
  const url = new URL(fs.readFileSync(file, 'utf8').trim());
  url.password = encodeURIComponent(readPassword());
  return url.toString();
}
