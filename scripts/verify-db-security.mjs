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
import { Client, clientOptions } from './lib/db.mjs';

// What `authenticated` may hold on each public table — exactly this, no more
// and no less. RLS filters rows on top of a privilege; a privilege the role
// never gets is one no policy has to be right about. A new table is a new line
// here, and a table missing from this map fails the check.
const CRUD = ['select', 'insert', 'update', 'delete'];
const TABLE_PRIVILEGES = {
  members: ['select'],
  // Imported content the app only ever reads.
  guides: ['select'],
  guide_chapters: ['select'],
  guide_images: ['select'],
  // Written once, when the first member sets the household's phrase: an update
  // would replace the wrapped master key and take every attachment and every
  // statement with it.
  household_key: ['select', 'insert'],
  chores: CRUD,
  shopping_items: CRUD,
  dates: CRUD,
  recipes: CRUD,
  documents: CRUD,
  statements: CRUD,
  merchant_rules: CRUD,
  notes: CRUD,
  trips: CRUD,
  trip_items: CRUD,
  attachments: CRUD,
};

// The one shape a policy may have: it grants the authenticated role what
// private.is_member() says, and nothing else. A `for select` policy has no
// with_check and a `for insert` one no qual, hence the null on either side.
const MEMBER_POLICY = 'private.is_member()';

const expectedPrivileges = Object.entries(TABLE_PRIVILEGES)
  .map(([table, privileges]) => {
    const listed = privileges.map((p) => p.toUpperCase()).sort();
    return `('${table}', '${listed.join(',')}')`;
  })
  .join(', ');

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
    name: 'authenticated holds exactly the privileges listed for each public table',
    sql: `with expected(table_name, privileges) as (values ${expectedPrivileges}),
               present as (
                 select c.relname::text as table_name
                 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relkind = 'r'
               ),
               granted as (
                 select table_name::text as table_name,
                        string_agg(distinct privilege_type, ',' order by privilege_type) as privileges
                 from information_schema.role_table_grants
                 where grantee = 'authenticated' and table_schema = 'public'
                 group by table_name
               )
          select coalesce(p.table_name, e.table_name)
                 || ': has ' || coalesce(g.privileges, '(none)')
                 || ', expected ' || coalesce(e.privileges, '(the table is not listed in verify-db-security.mjs)')
                 || case when p.table_name is null then ' — listed but no such table' else '' end
                 as violation
          from present p
          full outer join expected e on e.table_name = p.table_name
          left join granted g on g.table_name = coalesce(p.table_name, e.table_name)
          where p.table_name is null
             or e.table_name is null
             or coalesce(g.privileges, '') <> e.privileges`,
  },
  {
    // Permissive policies OR together, so one policy that says something else
    // opens the table however careful the others are.
    name: 'every policy on a public table is the private.is_member() policy',
    sql: `select p.tablename || ': ' || p.policyname as violation
          from pg_policies p
          where p.schemaname = 'public'
            and (p.roles <> '{authenticated}'::name[]
                 or coalesce(p.qual, '${MEMBER_POLICY}') <> '${MEMBER_POLICY}'
                 or coalesce(p.with_check, '${MEMBER_POLICY}') <> '${MEMBER_POLICY}'
                 or (p.qual is null and p.with_check is null))`,
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
  {
    // Sync integrity rather than access control: `updated_at` marks the
    // offline-synced tables, and without the guard a pushed stale edit would
    // overwrite a newer row and devices would stop converging.
    name: 'every public table with updated_at has the private.last_write_wins() trigger',
    sql: `select c.relname as violation
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'r'
            and exists (select 1 from pg_attribute a
                        where a.attrelid = c.oid and a.attname = 'updated_at'
                          and not a.attisdropped)
            and not exists (
              select 1 from pg_trigger t
              join pg_proc p on p.oid = t.tgfoid
              join pg_namespace pn on pn.oid = p.pronamespace
              where t.tgrelid = c.oid and not t.tgisinternal
                and pn.nspname = 'private' and p.proname = 'last_write_wins'
                and (t.tgtype & 2) <> 0     -- before
                and (t.tgtype & 16) <> 0    -- update
                and (t.tgtype & 1) <> 0)    -- row
          `,
  },
  {
    // Storage holds the attachment files: a public bucket would hand out
    // unauthenticated URLs to them.
    name: 'no storage bucket is public',
    sql: `select id as violation from storage.buckets where public`,
  },
  {
    name: 'every storage bucket is gated by a private.is_member() policy on storage.objects',
    sql: `select b.id as violation
          from storage.buckets b
          where not exists (
            select 1 from pg_policies p
            where p.schemaname = 'storage' and p.tablename = 'objects'
              and p.roles = '{authenticated}'::name[]
              and coalesce(p.qual, '') = format('((bucket_id = %L::text) AND ${MEMBER_POLICY})', b.id)
              and coalesce(p.with_check, '') = format('((bucket_id = %L::text) AND ${MEMBER_POLICY})', b.id))`,
  },
  {
    // Same reasoning as the public tables: one policy saying anything else is
    // enough, and here it would hand out the household's files.
    name: 'every policy on storage.objects names a bucket and private.is_member()',
    sql: `select policyname as violation
          from pg_policies p
          where p.schemaname = 'storage' and p.tablename = 'objects'
            and (p.roles <> '{authenticated}'::name[]
                 or not exists (
                   select 1 from storage.buckets b
                   where coalesce(p.qual, '') = format('((bucket_id = %L::text) AND ${MEMBER_POLICY})', b.id)
                     and coalesce(p.with_check, '') = format('((bucket_id = %L::text) AND ${MEMBER_POLICY})', b.id)))`,
  },
];

const client = new Client(clientOptions({ statement_timeout: 15000 }));

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
