// =============================================================================
// Verify the live database still satisfies the security invariants documented
// in CLAUDE.md. This is the guard that catches drift the migrations cannot see
// (e.g. privileges Supabase's default ACLs auto-grant to `anon`).
//
// Run standalone with `npm run db:verify`; it also runs automatically after
// `npm run db:push`. Exits non-zero (failing the command / CI step) on any
// violation.
//
// Connection: password from `.env` (SUPABASE_DB_PASSWORD), pooler URL from the
// linked project (`supabase/.temp/pooler-url`, created by `npm run db:link`).
// Catalog reads only — no application data is touched.
// =============================================================================
import { Client, connectionString } from './lib/db.mjs';

// Each check returns rows describing VIOLATIONS. Zero rows = pass.
const CHECKS = [
  {
    name: 'every public base table has RLS enabled',
    sql: `select c.relname as violation
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
  },
  {
    name: 'every public base table has a private.is_member() policy',
    sql: `select c.relname as violation
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'r'
            and not exists (
              select 1 from pg_policies p
              where p.schemaname = 'public' and p.tablename = c.relname
                and (coalesce(p.qual,'') ilike '%is_member%'
                     or coalesce(p.with_check,'') ilike '%is_member%'))`,
  },
  {
    name: 'anon has zero privileges on any public table',
    sql: `select table_name || ' [' || privilege_type || ']' as violation
          from information_schema.role_table_grants
          where grantee = 'anon' and table_schema = 'public'`,
  },
  {
    name: 'authenticated holds only SELECT/INSERT/UPDATE/DELETE on public tables',
    sql: `select table_name || ' [' || privilege_type || ']' as violation
          from information_schema.role_table_grants
          where grantee = 'authenticated' and table_schema = 'public'
            and privilege_type not in ('SELECT','INSERT','UPDATE','DELETE')`,
  },
  {
    name: 'no SECURITY DEFINER function lives in the public schema',
    sql: `select p.proname as violation
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.prosecdef`,
  },
  {
    name: 'no views in the public schema',
    sql: `select c.relname as violation
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind in ('v','m')`,
  },
  {
    name: 'every SECURITY DEFINER function pins search_path',
    sql: `select n.nspname || '.' || p.proname as violation
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where p.prosecdef
            and n.nspname not in ('pg_catalog','information_schema','auth','storage',
                                  'realtime','vault','extensions','graphql','graphql_public',
                                  'pgbouncer','supabase_migrations')
            and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) cfg
                            where cfg like 'search_path=%')`,
  },
  {
    // Scoped to `postgres` — the role our migrations create objects under, so
    // its defaults govern every table we ship. The platform-managed
    // `supabase_admin` defaults are out of scope (we can't alter them, and they
    // only apply to objects supabase_admin itself creates); the "anon has zero
    // privileges on any public table" check above is the real backstop.
    name: 'postgres default privileges never grant to anon in public',
    sql: `select 'postgres default for '
                 || case d.defaclobjtype when 'r' then 'tables' when 'S' then 'sequences'
                      when 'f' then 'functions' else d.defaclobjtype::text end as violation
          from pg_default_acl d
          left join pg_namespace n on n.oid = d.defaclnamespace
          where n.nspname = 'public' and d.defaclrole = 'postgres'::regrole
            and exists (select 1 from aclexplode(d.defaclacl) a
                        where a.grantee = 'anon'::regrole)`,
  },
];

const client = new Client({
  connectionString: connectionString(),
  ssl: { rejectUnauthorized: false },
  statement_timeout: 15000,
});

let failed = 0;
await client.connect();
for (const check of CHECKS) {
  const { rows } = await client.query(check.sql);
  if (rows.length === 0) {
    console.log(`  \x1b[32m✓\x1b[0m ${check.name}`);
  } else {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m ${check.name}`);
    for (const r of rows) console.log(`      → ${r.violation}`);
  }
}
await client.end();

if (failed > 0) {
  console.error(`\n\x1b[31mSecurity invariants FAILED: ${failed} check(s) violated.\x1b[0m`);
  process.exit(1);
}
console.log('\n\x1b[32mAll security invariants hold.\x1b[0m');
