// =============================================================================
// The PDFs an email brought, sealed by the worker for the household: this
// device's copies of them, fetched after every sync so a group is confirmed
// with no connection; what a confirm reads; and their removal, here and on
// the server, once no staged row needs them. Nothing here is ever opened: a
// file stays the sealed blob it came as until a confirm re-keys it into an
// attachment.
// =============================================================================
import { supabase } from '../../lib/supabase';
import * as engine from '../../lib/offline/engine';
import { INBOX_FILES } from '../../lib/offline/localTables';
import { TRIP_INBOX_SPEC, type TripInboxItem } from '../../lib/offline/specs';
import { fromBase64 } from '../../lib/householdKey';

/** The server's table of staged files. */
const INBOX_FILES_TABLE = 'trip_inbox_files';

/**
 * How old a staged file no row lists must be before the sweep removes it from
 * the server. A confirm's undo puts the rows back a moment after they went,
 * and a device that has not pulled the rows yet would take every file for an
 * orphan: the grace covers both by a wide margin.
 */
export const INBOX_FILE_ORPHAN_MIN_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** A staged file as this device holds it: sealed, with the key the worker
 *  wrapped for the household. */
export interface InboxFile {
  id: string;
  import_id: string;
  name: string;
  size: number;
  data: Uint8Array<ArrayBuffer>;
  wrapped_key: string;
  created_at: string;
}

/** A staged file as the server hands it out: the bytes as base64 text. */
interface ServerInboxFile extends Omit<InboxFile, 'data'> {
  data: string;
}

/** The ids of the files a staged row was printed in, in the email's order. */
export function inboxFileIds(row: Pick<TripInboxItem, 'file_ids'>): string[] {
  const ids: unknown = JSON.parse(row.file_ids);
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

const placeholders = (ids: string[]) => ids.map(() => '?').join(', ');

/** The copies this device holds among `ids`, in no particular order. */
async function localInboxFiles(ids: string[]): Promise<InboxFile[]> {
  if (ids.length === 0) return [];
  return engine.localQuery<InboxFile & Record<string, unknown>>(
    `SELECT * FROM ${INBOX_FILES.table} WHERE id IN (${placeholders(ids)})`,
    ...ids,
  );
}

/** Which of `ids` this device holds a copy of. */
export async function heldInboxFiles(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const rows = await engine.localQuery<{ id: string }>(
    `SELECT id FROM ${INBOX_FILES.table} WHERE id IN (${placeholders(ids)})`,
    ...ids,
  );
  return new Set(rows.map((row) => row.id));
}

async function keepInboxFile(file: InboxFile): Promise<void> {
  await engine.localWrite(
    INBOX_FILES.table,
    `INSERT OR REPLACE INTO ${INBOX_FILES.table}
       (id, import_id, name, size, data, wrapped_key, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    file.id,
    file.import_id,
    file.name,
    file.size,
    file.data,
    file.wrapped_key,
    file.created_at,
  );
}

/** Fetch `ids` from the server and keep them here. One the server no longer
 *  has is simply not among what comes back; a call that fails throws. */
async function fetchInboxFiles(ids: string[]): Promise<InboxFile[]> {
  const { data, error } = await supabase
    .from(INBOX_FILES_TABLE)
    .select('id, import_id, name, size, data, wrapped_key, created_at')
    .in('id', ids);
  if (error) throw error;
  const files = ((data ?? []) as ServerInboxFile[]).map((row) => ({
    ...row,
    data: fromBase64(row.data),
  }));
  for (const file of files) await keepInboxFile(file);
  return files;
}

/**
 * The files with these ids: this device's copies, the rest fetched from the
 * server and kept. Throws, in the member's words, when one cannot be had —
 * no connection, or the server no longer has it — so a confirm can write
 * nothing rather than a row short of its PDF.
 */
export async function readInboxFiles(ids: string[]): Promise<InboxFile[]> {
  const held = await localInboxFiles(ids);
  const have = new Set(held.map((file) => file.id));
  const missing = ids.filter((id) => !have.has(id));
  if (missing.length > 0) {
    if (!navigator.onLine) {
      throw new Error('Los PDF de este correo todavía no llegaron a este dispositivo.');
    }
    held.push(...(await fetchInboxFiles(missing)));
  }
  const byId = new Map(held.map((file) => [file.id, file]));
  return ids.map((id) => {
    const file = byId.get(id);
    if (!file) throw new Error('Alguno de los PDF de este correo ya no está en el servidor.');
    return file;
  });
}

/**
 * Let go of these staged files: the copies here at once, the server's as far
 * as it will take now. What it does not, the sweep takes later.
 */
export async function deleteInboxFiles(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await engine.localWrite(
    INBOX_FILES.table,
    `DELETE FROM ${INBOX_FILES.table} WHERE id IN (${placeholders(ids)})`,
    ...ids,
  );
  if (!navigator.onLine) return;
  try {
    await supabase.from(INBOX_FILES_TABLE).delete().in('id', ids);
  } catch {
    // Left for the sweep.
  }
}

/** Remove from the server the files whose email's rows are long gone: no
 *  staged row of the import is here, and the file is past the grace. */
async function sweepInboxFiles(imports: ReadonlySet<string>): Promise<void> {
  const { data, error } = await supabase
    .from(INBOX_FILES_TABLE)
    .select('id, import_id, created_at');
  if (error) throw error;
  const cutoff = Date.now() - INBOX_FILE_ORPHAN_MIN_AGE_MS;
  const orphans = ((data ?? []) as Pick<InboxFile, 'id' | 'import_id' | 'created_at'>[])
    .filter((file) => !imports.has(file.import_id) && Date.parse(file.created_at) < cutoff)
    .map((file) => file.id);
  if (orphans.length === 0) return;
  const { error: failure } = await supabase.from(INBOX_FILES_TABLE).delete().in('id', orphans);
  if (failure) throw failure;
}

/**
 * The staged files' side of a sync, once the tables are down: drop the
 * copies no staged row lists any more, fetch and keep every file a staged
 * row lists and this device lacks, and — only when the staged rows came down
 * in this very run, so an orphan is read off rows this device has actually
 * seen — sweep the server's files whose rows are long gone. A fetch that
 * fails throws, and the run leaves it for the next.
 */
export async function syncInboxFiles(synced: ReadonlySet<string>): Promise<void> {
  const rows = await engine.listVisible<TripInboxItem>(TRIP_INBOX_SPEC);
  const listed = [...new Set(rows.flatMap(inboxFileIds))];
  await engine.localWrite(
    INBOX_FILES.table,
    listed.length === 0
      ? `DELETE FROM ${INBOX_FILES.table}`
      : `DELETE FROM ${INBOX_FILES.table} WHERE id NOT IN (${placeholders(listed)})`,
    ...listed,
  );
  const held = await heldInboxFiles(listed);
  const missing = listed.filter((id) => !held.has(id));
  if (missing.length > 0) await fetchInboxFiles(missing);
  if (synced.has(TRIP_INBOX_SPEC.table)) {
    await sweepInboxFiles(new Set(rows.map((row) => row.import_id)));
  }
}
