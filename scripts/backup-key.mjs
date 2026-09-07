// =============================================================================
// The pair the backups are sealed with. The recipient (the public half) goes
// into the GitHub variable BACKUP_AGE_RECIPIENT, where the nightly job reads
// it; the identity (the private half) is shown once and goes into a note in
// Notas — sealed under the household key, on every device that has
// unlocked — and into nothing that runs. Losing it loses every backup, as
// losing the phrase loses every attachment. Clear the terminal after.
//
//   npm run backup:key
// =============================================================================
import { generateX25519Identity, identityToRecipient } from 'age-encryption';

const identity = await generateX25519Identity();
const recipient = await identityToRecipient(identity);

console.log('Recipient, for the GitHub variable BACKUP_AGE_RECIPIENT:\n');
console.log(`  ${recipient}\n`);
console.log('Identity, shown once, for a note in Notas and nowhere that runs:\n');
console.log(`  ${identity}\n`);
