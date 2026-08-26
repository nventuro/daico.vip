// =============================================================================
// SQLocal worker that persists to OPFS through the SQLite **SAH-pool VFS**.
//
// SQLocal's default worker opens the database with the classic OPFS VFS, which
// reaches the file system through a SharedArrayBuffer/Atomics async proxy and
// therefore requires cross-origin isolation (COOP/COEP response headers). The
// static host can't send those headers, so that VFS silently falls back to an
// in-memory database and nothing persists.
//
// The SAH-pool VFS opens OPFS sync access handles directly in this worker — no
// SharedArrayBuffer, no headers — so it persists on the static host. Same OPFS
// storage, different access strategy. The only cost is that it allows a single
// connection per origin; the engine enforces one tab with a Web Lock.
//
// This file mirrors SQLocal's own worker entry (its `dist/worker.js`) but swaps
// in a driver that opens an `OpfsSAHPoolDb`. Everything else — the query
// protocol, transactions, the local-only bookkeeping — is unchanged SQLocal.
// =============================================================================
import { SQLiteMemoryDriver, SQLocalProcessor } from 'sqlocal';
import { LOCAL_DB_VFS_NAME } from '../../types';

type InitConfig = Parameters<SQLiteMemoryDriver['init']>[0];

/**
 * A SQLocal driver that stores the database in OPFS via the SAH-pool VFS. It
 * inherits query/transaction/bookkeeping behaviour from the in-memory driver and
 * overrides only how the database is opened.
 */
class OpfsSahPoolDriver extends SQLiteMemoryDriver {
  readonly storageType = 'opfs';
  // The pool handle returned by installing the VFS; carries the DB constructor.
  private poolUtil?: { OpfsSAHPoolDb: new (path: string) => NonNullable<SQLiteMemoryDriver['db']> };

  async init(config: InitConfig): Promise<void> {
    const databasePath = config?.databasePath;
    if (!databasePath) throw new Error('No databasePath specified');

    if (!this.sqlite3InitModule) {
      const { default: sqlite3InitModule } = await import('@sqlite.org/sqlite-wasm');
      this.sqlite3InitModule = sqlite3InitModule;
    }
    if (!this.sqlite3) this.sqlite3 = await this.sqlite3InitModule();
    if (this.db) await this.destroy();

    // Install the SAH-pool VFS once, then open the database through it. The
    // handle is memoised so a re-init (SQLocal reconnect) reuses the same pool.
    if (!this.poolUtil) {
      this.poolUtil = await (
        this.sqlite3 as unknown as {
          installOpfsSAHPoolVfs: (opts: { name: string }) => Promise<OpfsSahPoolDriver['poolUtil']>;
        }
      ).installOpfsSAHPoolVfs({ name: LOCAL_DB_VFS_NAME });
    }
    this.db = new this.poolUtil!.OpfsSAHPoolDb(databasePath);
    this.config = config;
    this.initWriteHook();
  }
}

const driver = new OpfsSahPoolDriver();
const processor = new SQLocalProcessor(driver);

// Bridge the worker's message port to the processor. Typed structurally so this
// module needs neither the webworker lib (which conflicts with the DOM lib the
// app builds against) nor message types SQLocal keeps internal.
const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
};

workerScope.onmessage = (event) => {
  void processor.postMessage(event as Parameters<typeof processor.postMessage>[0]);
};
processor.onmessage = (message, transfer) => workerScope.postMessage(message, transfer);
