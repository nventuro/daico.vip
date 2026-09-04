// =============================================================================
// The database as the worker sees it: a connection as `trip_inbox_writer`
// through Hyperdrive, the members list for the gate, the household's inbox
// public key, and the one insert that stages an email.
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

/** The household's inbox public key, base64 SPKI, or null while the
 *  household has not published one: then nothing can be sealed for it. */
export async function inboxPublicKey(db: pg.Client): Promise<string | null> {
  const { rows } = await db.query<{ public_key: string }>(
    'select public_key from inbox_key limit 1',
  );
  return rows[0]?.public_key ?? null;
}

/** A PDF as it is staged beside the rows it belongs to: sealed, under the
 *  id those rows name it by. */
export interface InboxFile {
  id: string;
  /** What the attachment was called, extension off; '' when it had no name. */
  name: string;
  /** Of the PDF itself, before sealing. */
  size: number;
  /** Base64: the sealed bytes. */
  data: string;
  /** Base64: the file key, wrapped under the inbox public key. */
  wrapped_key: string;
}

const FILE_COLUMNS = ['id', 'import_id', 'name', 'size', 'data', 'wrapped_key'] as const;

const ROW_COLUMNS = [
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
  'file_ids',
] as const;

/** One multi-row insert: every tuple's values numbered on from the last. */
function insertStatement(
  table: string,
  columns: readonly string[],
  tuples: unknown[][],
): { sql: string; params: unknown[] } {
  const params: unknown[] = [];
  const values = tuples.map((values) => {
    const placeholders = values.map((value) => {
      params.push(value);
      return `$${params.length}`;
    });
    return `(${placeholders.join(', ')})`;
  });
  return {
    sql: `insert into ${table} (${columns.join(', ')}) values ${values.join(', ')}`,
    params,
  };
}

/**
 * Stages one email under a shared `import_id`: its sealed PDFs, then its
 * rows, in one transaction, so an email is either wholly staged or not at
 * all — never a row naming a file that is not there.
 */
export async function insertRows(
  db: pg.Client,
  importId: string,
  rows: InboxRow[],
  files: InboxFile[],
): Promise<void> {
  const inserts = [
    ...(files.length > 0
      ? [
          insertStatement(
            'trip_inbox_files',
            FILE_COLUMNS,
            files.map((file) => [
              file.id,
              importId,
              file.name,
              file.size,
              file.data,
              file.wrapped_key,
            ]),
          ),
        ]
      : []),
    insertStatement(
      'trip_inbox',
      ROW_COLUMNS,
      rows.map((row) => [
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
        JSON.stringify(row.file_ids),
      ]),
    ),
  ];
  await db.query('begin');
  try {
    for (const { sql, params } of inserts) await db.query(sql, params);
    await db.query('commit');
  } catch (error) {
    // The failure is the one reported; a rollback that fails on top of it
    // is the connection's, and ending the connection ends the transaction.
    await db.query('rollback').catch(() => undefined);
    throw error;
  }
}
