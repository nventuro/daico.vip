// =============================================================================
// In-memory stand-in for the Supabase client, covering exactly the PostgREST
// calls the sync engine makes: `from(t).upsert(row)`, `from(t).delete().eq('id', v)`
// and `from(t).select(columns)`. A test installs it with
//   vi.mock('../supabase', () => import('./testing/fakeSupabase'))
// and drives the server through `server`: seed rows, inspect the calls made,
// and hold or fail calls to reproduce timings between the app and the network.
// =============================================================================
export type ServerRow = Record<string, unknown> & { id: string };
export type ServerOp = 'upsert' | 'delete' | 'select';
export interface ServerCall {
  op: ServerOp;
  table: string;
  /** The row an upsert or delete targets. */
  id?: string;
}

type Interceptor = (call: ServerCall) => Promise<void> | void;

function matches(call: ServerCall, op: ServerOp, table: string | undefined): boolean {
  return call.op === op && (table === undefined || call.table === table);
}

export class FakeServer {
  private tables = new Map<string, Map<string, ServerRow>>();
  private interceptors = new Set<Interceptor>();
  /** Every call made, in order. */
  readonly calls: ServerCall[] = [];

  reset(): void {
    this.tables.clear();
    this.interceptors.clear();
    this.calls.length = 0;
  }

  rows(table: string): ServerRow[] {
    return [...this.table(table).values()].map((row) => ({ ...row }));
  }

  seed(table: string, rows: ServerRow[]): void {
    for (const row of rows) this.table(table).set(row.id, { ...row });
  }

  /** Make matching calls fail (as a returned PostgREST-style error) until `reset`. */
  fail(op: ServerOp, table?: string, message = 'fake server failure'): void {
    this.interceptors.add((call) => {
      if (matches(call, op, table)) throw new Error(message);
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
        if (!error) this.table(table).set(row.id, { ...row });
        return { error };
      },
      delete: () => ({
        eq: async (column: string, value: string) => {
          if (column !== 'id') throw new Error(`fake server: unsupported filter column ${column}`);
          const error = await this.run({ op: 'delete', table, id: value });
          if (!error) this.table(table).delete(value);
          return { error };
        },
      }),
      select: async (columns: string) => {
        const error = await this.run({ op: 'select', table });
        if (error) return { data: null, error };
        const names = columns.split(',').map((name) => name.trim());
        const data = this.rows(table).map((row) =>
          Object.fromEntries(names.map((name) => [name, row[name] ?? null])),
        );
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

export const supabase = { from: (table: string) => server.from(table) };
