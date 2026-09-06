// =============================================================================
// In-memory stand-in for the Supabase client, covering exactly the PostgREST
// calls the app makes: `from(t).upsert(row)`, `from(t).delete().eq('id', v)`
// and `.in('id', vs)`, `from(t).select(columns).order(c).limit(n)`, the
// filtered reads `.eq(c, v)` / `.in(c, vs)` / `.gt(c, v)`, the one-row read
// `from(t).select(columns).eq(c, v).maybeSingle()`, plus the files worker
// the attachment files reach over `fetch`, standing in for it as the global.
// It keeps the server's rules too: a write older than the stored row is
// skipped, and a row once deleted is never taken again.
// A test installs it with
//   vi.mock('../supabase', () => import('./testing/fakeSupabase'))
// and drives the server through `server`: seed rows and files, inspect the
// calls made, and hold or fail calls to reproduce timings between the app and
// the network.
// =============================================================================
import { vi } from 'vitest';
import { FILES_URL } from '../../../config';

export type ServerRow = Record<string, unknown> & { id: string };
export type ServerOp = 'upsert' | 'delete' | 'select' | 'upload' | 'download' | 'remove' | 'list';
export interface ServerCall {
  op: ServerOp;
  /** The table, or `FILES` for a call to the files worker. */
  table: string;
  /** The row an upsert or delete targets; the object a file call targets. */
  id?: string;
  /** How many rows a select asked for, when it said. */
  limit?: number;
  /** The id a select asked for the rows past, when it did. */
  after?: string;
}

/** The files worker, as a call's `table`. */
export const FILES = 'files';

/** Objects the fake worker lists per page, as many as the real one. */
export const FILES_LIST_PAGE = 1000;

/** An object in the fake bucket. */
export interface ServerObject {
  name: string;
  data: Uint8Array<ArrayBuffer>;
  /** When it went up, ISO. */
  uploaded: string;
}

/** How a call can be refused: the HTTP status the files worker answers with,
 *  the code PostgREST puts on a rejected row, or neither for a failure that
 *  never got an answer at all. `id` narrows the refusal to one row or object. */
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
  // The `deleted_rows` the server keeps: a row deleted from a table is never
  // taken again under that id.
  private deleted = new Map<string, Set<string>>();
  private objects = new Map<string, ServerObject>();
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
    this.deleted.clear();
    this.objects.clear();
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

  /** A row deleted on the server by some other device. */
  deleteRow(table: string, id: string): void {
    if (this.table(table).delete(id)) this.tombstones(table).add(id);
  }

  /** The ids the table has a deletion on record for. */
  deletedIds(table: string): string[] {
    return [...this.tombstones(table)];
  }

  files(): ServerObject[] {
    return [...this.objects.values()].map((object) => ({ ...object }));
  }

  seedFiles(objects: ServerObject[]): void {
    for (const object of objects) this.objects.set(object.name, { ...object });
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
        // The triggers every synced table carries, both of which skip the
        // write and say nothing about it: `delete_wins` takes no row of an id
        // deleted before, and `last_write_wins` no write arriving with an
        // older stamp than the stored row.
        if (this.tombstones(table).has(row.id)) return { error: null };
        const stored = this.table(table).get(row.id);
        if (stored && stamp(row) < stamp(stored)) return { error: null };
        this.table(table).set(row.id, { ...row });
        return { error: null };
      },
      delete: () => {
        const remove = async (column: string, value: string) => {
          if (column !== 'id') throw new Error(`fake server: unsupported filter column ${column}`);
          const error = await this.run({ op: 'delete', table, id: value });
          if (!error && this.member) this.deleteRow(table, value);
          return { error };
        };
        return {
          eq: remove,
          // One call per row, so a refusal can be narrowed to one of them.
          in: async (column: string, values: string[]) => {
            for (const value of values) {
              const { error } = await remove(column, value);
              if (error) return { error };
            }
            return { error: null };
          },
        };
      },
      // Chainable and awaitable at any point, like PostgREST's builder: the
      // request goes out when the caller awaits it.
      select: (columns: string) => {
        let orderBy: string | null = null;
        let limit: number | null = null;
        let after: string | null = null;
        const filters: ((row: ServerRow) => boolean)[] = [];
        const run = async () => {
          const error = await this.run({
            op: 'select',
            table,
            limit: limit ?? undefined,
            after: after ?? undefined,
          });
          if (error) return { data: null, error };
          let rows = this.member ? this.rows(table) : [];
          rows = rows.filter((row) => filters.every((keep) => keep(row)));
          if (orderBy !== null) {
            // By code point, as ids — uuids — order on the server.
            const key = orderBy;
            rows.sort((a, b) => (String(a[key]) < String(b[key]) ? -1 : 1));
          }
          // PostgREST answers a plain select with its first page and says
          // nothing about the rest; a limit asks for that many.
          rows = rows.slice(0, limit ?? DEFAULT_MAX_ROWS);
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
            filters.push((row) => row[column] === value);
            return builder;
          },
          in: (column: string, values: unknown[]) => {
            filters.push((row) => values.includes(row[column]));
            return builder;
          },
          gt: (column: string, value: string) => {
            if (column === 'id') after = value;
            filters.push((row) => String(row[column]) > value);
            return builder;
          },
          order: (column: string) => {
            orderBy = column;
            return builder;
          },
          limit: (count: number) => {
            limit = count;
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

  /**
   * The files worker, as the app reaches it: `fetch` against `FILES_URL`. A
   * request carries the session's token or is turned away; a call the fake
   * refuses with a status is answered with it, and one it fails with none
   * never gets an answer, as a lost connection has none.
   */
  readonly fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (!url.href.startsWith(FILES_URL)) throw new Error(`unexpected request to ${url.href}`);
    if (!new Headers(init?.headers).get('Authorization')?.startsWith('Bearer ')) {
      return new Response(null, { status: 401, statusText: 'Unauthorized' });
    }
    const method = init?.method ?? 'GET';
    const id = url.pathname.slice(1);
    const op: ServerOp =
      id === ''
        ? 'list'
        : method === 'PUT'
          ? 'upload'
          : method === 'DELETE'
            ? 'remove'
            : 'download';
    const error = await this.run({ op, table: FILES, ...(id === '' ? {} : { id }) });
    if (error) {
      const status = (error as CallFailure).status;
      if (status === undefined) throw error;
      return new Response(error.message, { status, statusText: error.message });
    }
    // The worker asks the server whether the caller is a member first.
    if (!this.member) return new Response(null, { status: 403, statusText: 'Forbidden' });
    switch (op) {
      case 'list': {
        const all = [...this.objects.values()];
        const start = Number(url.searchParams.get('cursor') ?? 0);
        const next = start + FILES_LIST_PAGE;
        return Response.json({
          objects: all.slice(start, next).map(({ name, uploaded }) => ({ name, uploaded })),
          cursor: next < all.length ? String(next) : null,
        });
      }
      case 'upload': {
        const data = new Uint8Array(await new Response(init?.body).arrayBuffer());
        this.objects.set(id, { name: id, data, uploaded: new Date().toISOString() });
        return new Response(null, { status: 204 });
      }
      case 'download': {
        const object = this.objects.get(id);
        if (!object) return new Response(null, { status: 404, statusText: 'Not Found' });
        return new Response(object.data, { status: 200 });
      }
      default: {
        this.objects.delete(id);
        return new Response(null, { status: 204 });
      }
    }
  };

  private table(name: string): Map<string, ServerRow> {
    let rows = this.tables.get(name);
    if (!rows) {
      rows = new Map();
      this.tables.set(name, rows);
    }
    return rows;
  }

  private tombstones(table: string): Set<string> {
    let ids = this.deleted.get(table);
    if (!ids) {
      ids = new Set();
      this.deleted.set(table, ids);
    }
    return ids;
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
  // A session there always is: the fake decides membership, not sign-in.
  auth: { getSession: () => Promise.resolve({ data: { session: { access_token: 'token' } } }) },
};

// The files worker is reached as the global `fetch`, so the fake stands in
// for that too, for as long as it is installed.
vi.stubGlobal('fetch', server.fetch);
