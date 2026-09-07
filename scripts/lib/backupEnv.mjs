// =============================================================================
// Where the backup reads from and writes to, and how: every name the nightly
// job or a script takes from its environment — the runner's secrets, or
// `.env` through with-env.mjs — is checked here, and the one name that lives
// in the repository, the attachments bucket's, is read from the files
// worker's configuration so it is written in one place.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { root } from './db.mjs';
import { bucket } from './s3.mjs';

/** The prefixes the backup bucket is laid out in. */
export const PREFIXES = {
  /** One a night; the bucket's lifecycle rule prunes it. */
  daily: 'daily/',
  /** The month's first run, again; kept. */
  monthly: 'monthly/',
  /** The guide tables, once per import, under their digest; kept. */
  guides: 'guides/',
  /** Every attachment file, once, as it is; kept. */
  objects: 'objects/',
};

/** The tables the guides importer owns: big, rarely changing, and so kept
 *  under a digest rather than read every night. */
export const GUIDE_TABLES = ['guides', 'guide_chapters', 'guide_images'];

/** The named variables, or an error naming the ones that are missing. */
export function required(names) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) throw new Error(`missing from the environment: ${missing.join(', ')}`);
  return Object.fromEntries(names.map((name) => [name, process.env[name].trim()]));
}

/** The attachments bucket's name, as the files worker is bound to it. */
export function attachmentsBucketName() {
  const config = fs.readFileSync(path.join(root, 'worker/wrangler.files.jsonc'), 'utf8');
  const name = /"bucket_name":\s*"([^"]+)"/.exec(config)?.[1];
  if (!name) throw new Error('no bucket_name in worker/wrangler.files.jsonc');
  return name;
}

/** The attachments bucket in R2, with whatever the token in hand may do. */
export function attachmentsBucket() {
  const env = required(['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']);
  return bucket({
    endpoint: env.R2_ENDPOINT,
    name: attachmentsBucketName(),
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  });
}

/** The backup bucket in B2, with whatever the key in hand may do. */
export function backupBucket() {
  const env = required(['B2_ENDPOINT', 'B2_BUCKET', 'B2_ACCESS_KEY_ID', 'B2_SECRET_ACCESS_KEY']);
  return bucket({
    endpoint: env.B2_ENDPOINT,
    name: env.B2_BUCKET,
    accessKeyId: env.B2_ACCESS_KEY_ID,
    secretAccessKey: env.B2_SECRET_ACCESS_KEY,
  });
}

/** `20260907T060000Z`: an instant as a file is named after it. */
export const stampOf = (date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
