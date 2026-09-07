// =============================================================================
// The nightly backup's database credential: sets (or rotates) the password
// of `backup_reader`, the role the job connects as, and prints the connection
// string once, for the GitHub secret BACKUP_DATABASE_URL — the one place it
// goes. The migration creates the role without a password on purpose, so no
// secret lands in the repository. Nothing else keeps it: clear the terminal
// after pasting.
//
//   npm run backup:reader
// =============================================================================
import { randomBytes } from 'node:crypto';
import { Client, clientOptions, connectionString } from './lib/db.mjs';

const ROLE = 'backup_reader';

// base64url of 32 random bytes: long enough, and made only of characters that
// need no quoting, which is what lets the ALTER ROLE below be a plain string.
const password = randomBytes(32).toString('base64url');
if (!/^[A-Za-z0-9_-]+$/.test(password)) throw new Error('unexpected password alphabet');

const client = new Client(clientOptions({ statement_timeout: 15000 }));
await client.connect();
await client.query(`alter role ${ROLE} with login password '${password}'`);
await client.end();

// The pooler URL names the project (`postgres.<ref>`); the job's role connects
// through the same pooler as `backup_reader.<ref>`, in session mode — the
// port the linked URL already carries.
const url = new URL(connectionString());
const ref = url.username.replace(/^postgres\./, '');
url.username = `${ROLE}.${ref}`;
url.password = password;

console.log(
  `Password of ${ROLE} set. Its connection string, shown once, for the GitHub secret BACKUP_DATABASE_URL:\n`,
);
console.log(`  ${url}\n`);
