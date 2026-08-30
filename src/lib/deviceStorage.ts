// =============================================================================
// What this device is holding, and letting go of what it can get again. The
// room is the local database's: the rows, and the two kinds of blob kept beside
// them — the attachment files and the guide images. Everything here is read
// straight from the local store; nothing leaves the device.
// =============================================================================
import * as engine from './offline/engine';
import { GUIDE_IMAGE_CACHE } from './offline/localTables';
import { attachmentFileUsage, dropCachedFiles } from './attachmentFiles';

/** How much room this device is taking, and whether it is safe there. */
export interface DeviceStorage {
  /** Whether the browser has undertaken not to evict any of this on its own;
   *  null where it will not say. */
  persisted: boolean | null;
  /** The database beyond the blobs below: the rows, the indexes and the pages
   *  SQLite is keeping free. */
  database: number;
  files: number;
  /** How much of `files` belongs to documents, which every device keeps. */
  documentFiles: number;
  guideImages: number;
}

async function bytesOf(table: string, column: string): Promise<number> {
  const rows = await engine.localQuery<{ bytes: number }>(
    `SELECT coalesce(sum(length(${column})), 0) AS bytes FROM ${table}`,
  );
  return rows[0]?.bytes ?? 0;
}

/** Every page SQLite has for this database, free ones included: that is what
 *  the device is actually giving it. */
async function databaseBytes(): Promise<number> {
  const [pages] = await engine.localQuery<{ page_count: number }>('PRAGMA page_count');
  const [size] = await engine.localQuery<{ page_size: number }>('PRAGMA page_size');
  return (pages?.page_count ?? 0) * (size?.page_size ?? 0);
}

async function persisted(): Promise<boolean | null> {
  try {
    return (await navigator.storage?.persisted?.()) ?? null;
  } catch {
    return null;
  }
}

export async function deviceStorage(): Promise<DeviceStorage> {
  const [whole, files, guideImages, promised] = await Promise.all([
    databaseBytes(),
    attachmentFileUsage(),
    bytesOf(GUIDE_IMAGE_CACHE.table, 'data'),
    persisted(),
  ]);
  // The blobs live in the same file as the rows, so what is left over is the
  // rest of it — never below zero, whatever the pages are doing.
  const database = Math.max(whole - files.bytes - guideImages, 0);
  return {
    persisted: promised,
    database,
    files: files.bytes,
    documentFiles: files.documentBytes,
    guideImages,
  };
}

/** Ask the browser again to keep what this device holds. Answers what it
 *  decided, which may be the same as before. */
export async function askToPersist(): Promise<boolean | null> {
  try {
    return (await navigator.storage?.persist?.()) ?? null;
  } catch {
    return null;
  }
}

/**
 * Let go of everything that can be fetched again — the guide images, and the
 * attachment files the bucket already has that are not documents'. What is
 * only here stays here.
 */
export async function freeSpace(): Promise<void> {
  await dropCachedFiles();
  await engine.localWrite(GUIDE_IMAGE_CACHE.table, `DELETE FROM ${GUIDE_IMAGE_CACHE.table}`);
}
