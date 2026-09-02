// =============================================================================
// The database as the worker sees it: a connection as `trip_inbox_writer`
// through Hyperdrive, the members list for the gate, and the one insert.
// =============================================================================
import pg from 'pg';
import type { InboxRow } from './extract';

/** One connection, opened per email and always ended by the caller; the
 *  pool behind it is Hyperdrive's. */
export async function openDb(connectionString: string): Promise<pg.Client> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  return client;
}

/** The addresses mail is accepted from. */
export async function memberEmails(db: pg.Client): Promise<string[]> {
  const { rows } = await db.query<{ email: string }>('select email from members');
  return rows.map((row) => row.email);
}

const COLUMNS = [
  'id',
  'import_id',
  'email_subject',
  'trip_title',
  'kind',
  'title',
  'on_date',
  'at_time',
  'ends_on',
  'ends_at',
  'from_code',
  'to_code',
  'comments',
] as const;

/** Stages the rows of one email under a shared `import_id`, in one statement
 *  so an email is either wholly staged or not at all. */
export async function insertRows(db: pg.Client, importId: string, rows: InboxRow[]): Promise<void> {
  const params: unknown[] = [];
  const tuples = rows.map((row) => {
    const values = [
      crypto.randomUUID(),
      importId,
      row.email_subject,
      row.trip_title,
      row.kind,
      row.title,
      row.on_date,
      row.at_time,
      row.ends_on,
      row.ends_at,
      row.from_code,
      row.to_code,
      row.comments,
    ];
    const placeholders = values.map((value) => {
      params.push(value);
      return `$${params.length}`;
    });
    return `(${placeholders.join(', ')})`;
  });
  await db.query(
    `insert into trip_inbox (${COLUMNS.join(', ')}) values ${tuples.join(', ')}`,
    params,
  );
}
