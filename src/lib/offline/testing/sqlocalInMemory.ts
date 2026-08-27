// =============================================================================
// Test double for the `sqlocal` package: the real SQLocal client on the real
// SQLite (wasm) engine, but in memory and in-process instead of persisted to
// OPFS through a Web Worker. A test installs it with
//   vi.mock('sqlocal', () => import('./testing/sqlocalInMemory'))
// and the store code then runs unmodified against a real database.
// =============================================================================
import { vi } from 'vitest';
import type { SQLocal as SQLocalClient } from 'sqlocal';

const actual = await vi.importActual<typeof import('sqlocal')>('sqlocal');

export const { SQLocalProcessor, SQLiteMemoryDriver, SQLiteOpfsDriver, SQLiteKvvfsDriver } = actual;

type ClientConfig = ConstructorParameters<typeof actual.SQLocal>[0];

/**
 * Statements run when the database opens, before the client's own `onInit`
 * ones — e.g. to pre-create a table in an older shape so a migration has
 * something to migrate. Push onto it before the first store call.
 */
export const seedSql: string[] = [];

let current: SQLocalClient | null = null;

/** The client the code under test opened, for raw SQL assertions. */
export function localDb(): SQLocalClient {
  if (!current) throw new Error('No local database has been opened yet');
  return current;
}

// The store opens its database through a Worker, which Node doesn't have. The
// stub only needs to be constructible: the in-process processor below replaces it.
vi.stubGlobal(
  'Worker',
  class {
    terminate(): void {}
  },
);

export class SQLocal extends actual.SQLocal {
  constructor(config: ClientConfig) {
    const cfg = typeof config === 'string' ? { databasePath: config } : config;
    let connect!: () => void;
    const connected = new Promise<void>((resolve) => {
      connect = resolve;
    });
    super({
      ...cfg,
      databasePath: ':memory:',
      processor: new actual.SQLocalProcessor(new actual.SQLiteMemoryDriver()),
      onInit: (sql) => {
        const own = cfg.onInit?.(sql);
        return [...seedSql.map((statement) => sql(statement)), ...(Array.isArray(own) ? own : [])];
      },
      onConnect: (reason) => {
        connect();
        cfg.onConnect?.(reason);
      },
    });
    // In-process, SQLocal's init runs after construction with no ordering
    // guarantee against the first query (its mutex isn't FIFO), whereas the
    // Worker path's message queue serialises them. Hold queries until connected.
    const sql = this.sql;
    const transaction = this.transaction;
    this.sql = async (queryTemplate, ...params) => {
      await connected;
      return sql(queryTemplate, ...params);
    };
    this.transaction = async (fn) => {
      await connected;
      return transaction(fn);
    };
    // Recorded so tests can reach the client the store opened.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    current = this;
  }
}
