// =============================================================================
// Run a command with the named variables from `.env`, and only those: every
// script in package.json needs one secret at most, and a script that gets
// them all could pass any of them on — to a subprocess, into a log.
//
//   node scripts/with-env.mjs VAR [VAR…] -- <command> [args…]
//
// `NAME=VAR` hands the command `.env`'s VAR under the name NAME, for a tool
// that reads one fixed name when `.env` keeps more than one of its kind.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const separator = process.argv.indexOf('--');
if (separator === -1 || separator === process.argv.length - 1) {
  console.error('usage: with-env.mjs VAR [VAR…] -- <command> [args…]');
  process.exit(2);
}
const names = process.argv.slice(2, separator);
const [command, ...args] = process.argv.slice(separator + 1);

const env = { ...process.env };
const file = fs.readFileSync(path.join(root, '.env'), 'utf8');
for (const entry of names) {
  const [name, variable = name] = entry.split('=');
  const match = new RegExp(`^${variable}=(.*)$`, 'm').exec(file);
  if (!match) {
    console.error(`${variable} is not in .env`);
    process.exit(2);
  }
  env[name] = match[1].trim();
}

const { status, error } = spawnSync(command, args, { stdio: 'inherit', env, shell: false });
if (error) {
  console.error(error.message);
  process.exit(1);
}
process.exit(status ?? 1);
