// =============================================================================
// In-memory stand-in for the Supabase client, covering exactly the PostgREST
// calls the app makes: `from(t).upsert(row)`, `from(t).delete().eq('id', v)`,
// `from(t).select(columns).order(c).range(from, to)` and the one-row read
// `from(t).select(columns).eq(c, v).maybeSingle()`, plus the Storage calls the
// attachment files make: `storage.from(b).upload / download / remove / list`.
// A test installs it with
//   vi.mock('../supabase', () => import('./testing/fakeSupabase'))
// and drives the server through `server`: seed rows and objects, inspect the
// calls made, and hold or fail calls to reproduce timings between the app and
// the network.
// =============================================================================
export type ServerRow = Record<string, unknown> & { id: string };
export type ServerOp = 'upsert' | 'delete' | 'select' | 'upload' | 'download' | 'remove' | 'list';
export interface ServerCall {
  op: ServerOp;
  /** The table, or the bucket for a storage call. */
  table: string;
  /** The row an upsert or delete targets; the object a storage call targets. */
  id?: string;
  /** The rows a select asked for, when it asked for a range of them. */
  range?: { from: number; to: number };
}

/** An object in a fake bucket. */
export interface ServerObject {
  name: string;
  data: Uint8Array<ArrayBuffer>;
  /** ISO timestamp, or null for an object the bucket reports no age for. */
  created_at: string | null;
}

/** How a call can be refused: the HTTP status a storage call reports, the code
 *  PostgREST puts on a rejected row, or neither for a failure that never got
 *  an answer at all. `id` narrows the refusal to one row or object. */
export interface Refusal {
  status?: number;
  code?: string;
  id?: string;
}

/** The shape of a failed call's error, as supabase-js reports it. */
interface CallFailure extends Error, Refusal {}

type Interceptor = (call: ServerCall) => Promise<void> | void;

/** What PostgREST returns for a select that names no range — its `max-rows`. */
const DEFAULT_MAX_ROWS = 1000;

function matches(call: ServerCall, op: ServerOp, table: string | undefined): boolean {
  return call.op === op && (table === undefined || call.table === table);
}

/** When a row was last written, as the trigger reads it. */
function stamp(row: ServerRow): number {
  return Date.parse(String(row.updated_at));
}

/** The error PostgREST reports for a row a policy will not take. */
function rowLevelSecurity(): CallFailure {
  const error: CallFailure = new Error('new row violates row-level security policy');
  error.code = '42501';
  return error;
}

export class FakeServer {
  private tables = new Map<string, Map<string, ServerRow>>();
  private buckets = new Map<string, Map<string, ServerObject>>();
  private interceptors = new Set<Interceptor>();
  /** Every call made, in order. */
  readonly calls: ServerCall[] = [];
  /**
   * Whether the calling session passes `private.is_member()`. Set false to
   * answer as the server does to a signed-in account that is not a member:
   * every row hidden, every write refused. Its delete is not refused so much
   * as ignored — it matches no row it is allowed to see.
   */
  member = true;

  reset(): void {
    this.tables.clear();
    this.buckets.clear();
    this.interceptors.clear();
    this.calls.length = 0;
    this.member = true;
  }

  /** Stop failing or holding calls; rows, objects and the call log stay. */
  restore(): void {
    this.interceptors.clear();
  }

  rows(table: string): ServerRow[] {
    return [...this.table(table).values()].map((row) => ({ ...row }));
  }

  seed(table: string, rows: ServerRow[]): void {
    for (const row of rows) this.table(table).set(row.id, { ...row });
  }

  objects(bucket: string): ServerObject[] {
    return [...this.bucket(bucket).values()].map((object) => ({ ...object }));
  }

  seedObjects(bucket: string, objects: ServerObject[]): void {
    for (const object of objects) this.bucket(bucket).set(object.name, { ...object });
  }

  /**
   * Make matching calls fail (as a returned PostgREST/Storage-style error)
   * until `reset`. With no `refusal` the failure reads as a network one.
   */
  fail(op: ServerOp, table?: string, message = 'fake server failure', refusal: Refusal = {}): void {
    this.interceptors.add((call) => {
      if (!matches(call, op, table)) return;
      if (refusal.id !== undefined && call.id !== refusal.id) return;
      const error: CallFailure = new Error(message);
      if (refusal.status !== undefined) error.status = refusal.status;
      if (refusal.code !== undefined) error.code = refusal.code;
      throw error;
    });
  }

  /**
   * Suspend matching calls until `release`; `started` resolves once the first
   * one has arrived. Releasing also stops holding later calls.
   */
  hold(op: ServerOp, table?: string): { started: Promise<ServerCall>; release: () => void } {
    let release!: () => void;
    let start!: (call: ServerCall) => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const started = new Promise<ServerCall>((resolve) => {
      start = resolve;
    });
    const interceptor: Interceptor = async (call) => {
      if (!matches(call, op, table)) return;
      start(call);
      await gate;
    };
    this.interceptors.add(interceptor);
    return {
      started,
      release: () => {
        this.interceptors.delete(interceptor);
        release();
      },
    };
  }

  from(table: string) {
    return {
      upsert: async (row: ServerRow) => {
        const error = await this.run({ op: 'upsert', table, id: row.id });
        if (error) return { error };
        if (!this.member) return { error: rowLevelSecurity() };
        // The `last_write_wins` trigger every synced table carries: a write
        // arriving with an older stamp than the stored row is skipped, and
        // says nothing about it.
        const stored = this.table(table).get(row.id);
        if (stored && stamp(row) < stamp(stored)) return { error: null };
        this.table(table).set(row.id, { ...row });
        return { error: null };
      },
      delete: () => ({
        eq: async (column: string, value: string) => {
          if (column !== 'id') throw new Error(`fake server: unsupported filter column ${column}`);
          const error = await this.run({ op: 'delete', table, id: value });
          if (!error && this.member) this.table(table).delete(value);
          return { error };
        },
      }),
      // Chainable and awaitable at any point, like PostgREST's builder: the
      // request goes out when the caller awaits it.
      select: (columns: string) => {
        let orderBy: string | null = null;
        let range: { from: number; to: number } | null = null;
        let filter: { column: string; value: unknown } | null = null;
        const run = async () => {
          const error = await this.run({ op: 'select', table, range: range ?? undefined });
          if (error) return { data: null, error };
          let rows = this.member ? this.rows(table) : [];
          if (filter !== null) rows = rows.filter((row) => row[filter!.column] === filter!.value);
          if (orderBy !== null) {
            rows.sort((a, b) => String(a[orderBy!]).localeCompare(String(b[orderBy!])));
          }
          // PostgREST answers a plain select with its first page and says
          // nothing about the rest; a range asks for the page it names.
          rows = rows.slice(range?.from ?? 0, (range?.to ?? DEFAULT_MAX_ROWS - 1) + 1);
          // `*` answers with every column the row has, as PostgREST does;
          // anything else is the projection it names.
          if (columns.trim() === '*') return { data: rows.map((row) => ({ ...row })), error: null };
          const names = columns.split(',').map((name) => name.trim());
          const data = rows.map((row) =>
            Object.fromEntries(names.map((name) => [name, row[name] ?? null])),
          );
          return { data, error: null };
        };
        const builder = {
          eq: (column: string, value: unknown) => {
            filter = { column, value };
            return builder;
          },
          order: (column: string) => {
            orderBy = column;
            return builder;
          },
          range: (from: number, to: number) => {
            range = { from, to };
            return builder;
          },
          // The row the filters name, or null when there is none — PostgREST
          // only errors here if more than one comes back.
          maybeSingle: async () => {
            const { data, error } = await run();
            return { data: data?.[0] ?? null, error };
          },
          then: <R>(
            resolve: (value: Awaited<ReturnType<typeof run>>) => R,
            reject?: (reason: unknown) => R,
          ) => run().then(resolve, reject),
        };
        return builder;
      },
    };
  }

  storage(bucket: string) {
    const objects = this.bucket(bucket);
    const storageError = (error: Error | null) =>
      error ? { message: error.message, status: (error as CallFailure).status } : null;
    // The bucket is gated by the same membership policy as the tables.
    const forbidden = (): CallFailure | null => {
      if (this.member) return null;
      const error: CallFailure = new Error('new row violates row-level security policy');
      error.status = 403;
      return error;
    };
    return {
      upload: async (path: string, body: Blob, options?: { upsert?: boolean }) => {
        let error = (await this.run({ op: 'upload', table: bucket, id: path })) ?? forbidden();
        if (!error && objects.has(path) && !options?.upsert) {
          const duplicate: CallFailure = new Error('The resource already exists');
          duplicate.status = 409;
          error = duplicate;
        }
        if (!error) {
          objects.set(path, {
            name: path,
            data: new Uint8Array(await body.arrayBuffer()),
            created_at: new Date().toISOString(),
          });
        }
        return { data: error ? null : { path }, error: storageError(error) };
      },
      download: async (path: string) => {
        const error = (await this.run({ op: 'download', table: bucket, id: path })) ?? forbidden();
        const object = objects.get(path);
        if (error) return { data: null, error: storageError(error) };
        if (!object) {
          const missing: CallFailure = new Error('Object not found');
          missing.status = 404;
          return { data: null, error: storageError(missing) };
        }
        return { data: new Blob([object.data]), error: null };
      },
      remove: async (paths: string[]) => {
        const error = (await this.run({ op: 'remove', table: bucket })) ?? forbidden();
        if (!error) for (const path of paths) objects.delete(path);
        return { data: error ? null : [], error: storageError(error) };
      },
      list: async (_prefix?: string, options?: { limit?: number; offset?: number }) => {
        const error = (await this.run({ op: 'list', table: bucket })) ?? forbidden();
        if (error) return { data: null, error: storageError(error) };
        const offset = options?.offset ?? 0;
        const limit = options?.limit ?? 100;
        const data = [...objects.values()]
          .slice(offset, offset + limit)
          .map(({ name, created_at }) => ({ name, created_at }));
        return { data, error: null };
      },
    };
  }

  private table(name: string): Map<string, ServerRow> {
    let rows = this.tables.get(name);
    if (!rows) {
      rows = new Map();
      this.tables.set(name, rows);
    }
    return rows;
  }

  private bucket(name: string): Map<string, ServerObject> {
    let objects = this.buckets.get(name);
    if (!objects) {
      objects = new Map();
      this.buckets.set(name, objects);
    }
    return objects;
  }

  private async run(call: ServerCall): Promise<Error | null> {
    this.calls.push(call);
    try {
      for (const interceptor of this.interceptors) await interceptor(call);
    } catch (error) {
      return error as Error;
    }
    return null;
  }
}

export const server = new FakeServer();

export const supabase = {
  from: (table: string) => server.from(table),
  storage: { from: (bucket: string) => server.storage(bucket) },
};
