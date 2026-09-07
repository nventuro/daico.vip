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
  // Imported content the household shelves: the app writes a guide's title,
  // group and archived flag and never removes one; its chapters and images
  // are only ever read.
  guides: ['select', 'insert', 'update'],
  guide_chapters: ['select'],
  guide_images: ['select'],
  // Written once, when the first member sets the household's phrase: an update
  // would replace the wrapped master key and take every attachment and every
  // statement with it.
  household_key: ['select', 'insert'],
  // The pair the email worker seals a PDF to: written once, as household_key
  // is, by the first device holding the master key that finds none.
  inbox_key: ['select', 'insert'],
  chores: CRUD,
  shopping_items: CRUD,
  dates: CRUD,
  recipes: CRUD,
  documents: CRUD,
  statements: CRUD,
  merchant_rules: CRUD,
  // One member's each: the owner policy below hands a member only their own.
  checkups: CRUD,
  health_records: CRUD,
  notes: CRUD,
  ideas: CRUD,
  trips: CRUD,
  trip_items: CRUD,
  trip_inbox: CRUD,
  // The sealed PDFs an email brought: written by the worker, read and deleted
  // by the app, never edited.
  trip_inbox_files: ['select', 'delete'],
  // Which emails the worker has staged, so none is staged twice: the
  // worker's to write, and only ever read here.
  trip_inbox_imports: ['select'],
  attachments: CRUD,
  // The record of every deletion, written and read by the triggers on the
  // app's behalf; the app itself only ever reads it.
  deleted_rows: ['select'],
};

// The email worker's role: what the pipeline that stages trip suggestions may
// touch, and nothing else. Insert-only on the staging tables, the sender
// gate's read of members, and the read of the key it seals a PDF to — a
// compromised worker can add junk suggestions, learn the member emails it
// already handles mail for and the public half of a key, but read or change
// nothing else.
const WRITER_ROLE = 'trip_inbox_writer';
const WRITER_GRANTS = [
  ['trip_inbox', 'INSERT'],
  ['trip_inbox_files', 'INSERT'],
  ['trip_inbox_imports', 'INSERT'],
  ['trip_inbox_imports', 'SELECT'],
  ['members', 'SELECT'],
  ['inbox_key', 'SELECT'],
];

// The shape every policy has but for the exception below: it grants the
// authenticated role what private.is_member() says, and nothing else. A `for
// select` policy has no with_check and a `for insert` one no qual, hence the
// null on either side.
const MEMBER_POLICY = 'private.is_member()';

// The one other shape, on the tables listed here alone: a member sees and
// writes only the rows that are theirs — `owner` is the auth user id of
// whoever created the row. Postgres prints the expression back in exactly this
// form. A table here must carry this policy and no other: permissive policies
// OR together, and the plain member one beside it would hand every member
// every row.
const OWNER_TABLES = ['checkups', 'health_records'];
const OWNER_POLICY = '(private.is_member() AND (owner = auth.uid()))';
const ownerTables = OWNER_TABLES.map((table) => `'${table}'`).join(', ');

// The one row each of the household's two keys: a second write must fail
// rather than leave two, which is what these indexes are for.
const WRITE_ONCE_INDEXES = [
  ['household_key', 'household_key_single'],
  ['inbox_key', 'inbox_key_single'],
];

// The body of the membership function, as its migration wrote it: everything
// hangs off it, so a change to it must be a migration in the repository and
// never an edit in the dashboard. Compared with whitespace collapsed.
const IS_MEMBER_BODY = `
  select exists (
    select 1
    from public.members m
    join auth.identities i
      on lower(i.identity_data ->> 'email') = lower(m.email)
    where i.user_id = auth.uid()
      and i.provider = 'google'
      and coalesce((i.identity_data ->> 'email_verified')::boolean, false)
  )
`;

// The gate on who becomes a user at all, in the same terms: the auth server
// asks it before making a user (its «before user created» hook, switched on
// in the dashboard and pointed at it) and it answers by the roster, so a
// stranger who signs in leaves no row behind. Pinned for the same reason.
const HOOK_ROLE = 'supabase_auth_admin';
const BEFORE_USER_CREATED_BODY = `
  select case
    when exists (
      select 1 from public.members m
      where lower(m.email) = lower(event -> 'user' ->> 'email')
    ) then '{}'::jsonb
    else jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'This account is not a member.'
    ))
  end
`;
const PINNED_FUNCTIONS = [
  { name: 'is_member', body: IS_MEMBER_BODY },
  { name: 'before_user_created', body: BEFORE_USER_CREATED_BODY },
];
const collapsed = (sql) => sql.replace(/\s+/g, ' ').trim().replace(/'/g, "''");

// The triggers a table may carry, and nothing else: the last-write-wins guard
// on every synced table, and the pair that makes a delete final on every
// table the app may delete from. Postgres keeps a trigger's timing and events
// as bits of tgtype: 1 row, 2 before, 4 insert, 8 delete, 16 update.
const TRIGGERS = [
  { name: 'last_write_wins', on: 'updated_at', tgtype: 1 | 2 | 16 },
  { name: 'delete_wins', on: 'delete', tgtype: 1 | 2 | 4 },
  { name: 'record_deletion', on: 'delete', tgtype: 1 | 8 },
];

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
          where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity`,
  },
  {
    name: 'every public base table has a private.is_member() policy',
    sql: `select c.relname as violation
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind in ('r', 'p')
            and not exists (
              select 1 from pg_policies p
              where p.schemaname = 'public' and p.tablename = c.relname
                and (coalesce(p.qual,'') ilike '%is_member%'
                     or coalesce(p.with_check,'') ilike '%is_member%'))`,
  },
  {
    // Asked of the role itself rather than read off its grants: a grant to
    // PUBLIC, to a role anon is a member of, or on a single column reaches anon
    // just the same and is listed under none of its own.
    name: 'anon holds no privilege on any public table or column, however it would get there',
    sql: `select c.relname || ' [' || priv || ']' as violation
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
          cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'])
            as priv
          where n.nspname = 'public' and c.relkind in ('r','p','v','m')
            and (has_table_privilege('anon', c.oid, priv)
                 or (priv in ('SELECT','INSERT','UPDATE','REFERENCES')
                     and has_any_column_privilege('anon', c.oid, priv)))`,
  },
  {
    name: 'anon can call no function in public or private, and cannot see into private',
    sql: `select n.nspname || '.' || p.proname || '()' as violation
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname in ('public', 'private')
            and has_function_privilege('anon', p.oid, 'EXECUTE')
          union all
          select 'usage on schema private' as violation
          where has_schema_privilege('anon', 'private', 'USAGE')`,
  },
  {
    name: 'authenticated holds exactly the privileges listed for each public table',
    sql: `with expected(table_name, privileges) as (values ${expectedPrivileges}),
               present as (
                 select c.relname::text as table_name
                 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relkind in ('r', 'p')
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
    // opens the table however careful the others are. Besides the member ones
    // may exist the owner policy on the tables pinned for it, and the email
    // worker's, in exactly the shapes pinned here — anything else is drift.
    name: 'every policy on a public table is the is_member() policy, the owner policy on its tables, or a pinned writer policy',
    sql: `select p.tablename || ': ' || p.policyname as violation
          from pg_policies p
          where p.schemaname = 'public'
            and not (p.roles = '{authenticated}'::name[]
                     and coalesce(p.qual, '${MEMBER_POLICY}') = '${MEMBER_POLICY}'
                     and coalesce(p.with_check, '${MEMBER_POLICY}') = '${MEMBER_POLICY}'
                     and not (p.qual is null and p.with_check is null))
            and not (p.roles = '{authenticated}'::name[]
                     and p.tablename in (${ownerTables})
                     and coalesce(p.qual, '${OWNER_POLICY}') = '${OWNER_POLICY}'
                     and coalesce(p.with_check, '${OWNER_POLICY}') = '${OWNER_POLICY}'
                     and not (p.qual is null and p.with_check is null))
            and not (p.roles = '{${WRITER_ROLE}}'::name[]
                     and ((p.tablename in ('trip_inbox', 'trip_inbox_files', 'trip_inbox_imports')
                           and p.cmd = 'INSERT' and p.qual is null and p.with_check = 'true')
                          or (p.tablename in ('members', 'inbox_key', 'trip_inbox_imports')
                              and p.cmd = 'SELECT' and p.qual = 'true' and p.with_check is null)))`,
  },
  {
    name: 'a per-member table carries the owner policy and no other',
    sql: `select p.tablename || ': ' || p.policyname as violation
          from pg_policies p
          where p.schemaname = 'public' and p.tablename in (${ownerTables})
            and not (coalesce(p.qual, '${OWNER_POLICY}') = '${OWNER_POLICY}'
                     and coalesce(p.with_check, '${OWNER_POLICY}') = '${OWNER_POLICY}')
          union all
          select t.table_name || ': no policy at all' as violation
          from (values ${OWNER_TABLES.map((table) => `('${table}')`).join(', ')}) as t(table_name)
          where not exists (select 1 from pg_policies p
                            where p.schemaname = 'public' and p.tablename = t.table_name)`,
  },
  {
    name: `${WRITER_ROLE} holds exactly its listed privileges`,
    sql: `with expected(table_name, privilege_type) as (values ${WRITER_GRANTS.map(
      ([t, p]) => `('${t}', '${p}')`,
    ).join(', ')}),
               granted as (
                 select table_schema::text, table_name::text, privilege_type::text
                 from information_schema.role_table_grants
                 where grantee = '${WRITER_ROLE}'
               )
          select g.table_schema || '.' || g.table_name || ' [' || g.privilege_type || ']' as violation
          from granted g
          where g.table_schema <> 'public'
             or not exists (select 1 from expected e
                            where e.table_name = g.table_name
                              and e.privilege_type = g.privilege_type)
          union all
          select e.table_name || ' [' || e.privilege_type || '] — missing' as violation
          from expected e
          where not exists (select 1 from granted g
                            where g.table_schema = 'public'
                              and g.table_name = e.table_name
                              and g.privilege_type = e.privilege_type)`,
  },
  {
    // The narrow grants only mean something if the role cannot step around
    // them: no RLS bypass, no capability flags, no membership in any role
    // (membership in e.g. authenticated would OR the member policies in).
    name: `${WRITER_ROLE} can log in and nothing more`,
    sql: `select '${WRITER_ROLE}: ' || attr as violation
          from pg_roles r,
               lateral (values ('superuser', r.rolsuper),
                               ('createdb', r.rolcreatedb),
                               ('createrole', r.rolcreaterole),
                               ('bypassrls', r.rolbypassrls),
                               ('replication', r.rolreplication),
                               ('cannot log in', not r.rolcanlogin)) as flags(attr, held)
          where r.rolname = '${WRITER_ROLE}' and held
          union all
          select '${WRITER_ROLE}: member of ' || g.rolname as violation
          from pg_auth_members m
          join pg_roles r on r.oid = m.member
          join pg_roles g on g.oid = m.roleid
          where r.rolname = '${WRITER_ROLE}'
          union all
          select '${WRITER_ROLE}: role does not exist' as violation
          where not exists (select 1 from pg_roles where rolname = '${WRITER_ROLE}')`,
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
    // Pinned, and pinned empty: a search_path that names a schema still lets
    // an object planted there be found first.
    name: 'every SECURITY DEFINER function pins search_path to nothing',
    sql: `select n.nspname || '.' || p.proname as violation
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where p.prosecdef
            and n.nspname not in ('pg_catalog','information_schema','auth','storage',
                                  'realtime','vault','extensions','graphql','graphql_public',
                                  'pgbouncer','supabase_migrations')
            and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) cfg
                            where cfg in ('search_path=', 'search_path=""'))`,
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
    // overwrite a newer row and devices would stop converging; without the
    // deletion record an edit pushed after a delete would put the row back.
    name: 'every synced table carries the last-write-wins guard, every deletable table the delete-wins pair, all enabled',
    sql: `with expected(trigger_name, tgtype, wanted) as (values ${TRIGGERS.map(
      ({ name, on, tgtype }) => `('${name}', ${tgtype}, '${on}')`,
    ).join(', ')})
          select c.relname || ': ' || e.trigger_name || ' missing, disabled or mistimed' as violation
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
          cross join expected e
          where n.nspname = 'public' and c.relkind in ('r', 'p')
            and ((e.wanted = 'updated_at'
                  and exists (select 1 from pg_attribute a
                              where a.attrelid = c.oid and a.attname = 'updated_at'
                                and not a.attisdropped))
                 or (e.wanted = 'delete' and has_table_privilege('authenticated', c.oid, 'DELETE')))
            and not exists (
              select 1 from pg_trigger t
              join pg_proc p on p.oid = t.tgfoid
              join pg_namespace pn on pn.oid = p.pronamespace
              where t.tgrelid = c.oid and not t.tgisinternal
                and pn.nspname = 'private' and p.proname = e.trigger_name
                and t.tgenabled <> 'D'      -- a disabled trigger is no trigger
                and (t.tgtype & 31) = e.tgtype)`,
  },
  {
    // A trigger nobody wrote up: one that bumps updated_at on the server
    // would break the ordering of offline edits, and any other is drift.
    name: 'no public table carries a trigger but the ones above',
    sql: `select c.relname || ': ' || t.tgname as violation
          from pg_trigger t
          join pg_class c on c.oid = t.tgrelid
          join pg_namespace n on n.oid = c.relnamespace
          join pg_proc p on p.oid = t.tgfoid
          join pg_namespace pn on pn.oid = p.pronamespace
          where n.nspname = 'public' and not t.tgisinternal
            and not (pn.nspname = 'private'
                     and (pn.nspname || '.' || p.proname, t.tgtype & 31) in (${TRIGGERS.map(
                       ({ name, tgtype }) => `('private.${name}', ${tgtype})`,
                     ).join(', ')}))`,
  },
  {
    name: 'each of the household keys is held to one row by its unique index',
    sql: `select t.table_name || ': ' || t.index_name || ' missing or not unique' as violation
          from (values ${WRITE_ONCE_INDEXES.map(([t, i]) => `('${t}', '${i}')`).join(', ')})
            as t(table_name, index_name)
          where not exists (
            select 1 from pg_indexes i
            where i.schemaname = 'public' and i.tablename = t.table_name
              and i.indexname = t.index_name
              and i.indexdef like 'CREATE UNIQUE INDEX %((true))')`,
  },
  ...PINNED_FUNCTIONS.map(({ name, body }) => ({
    name: `private.${name}() reads exactly as its migration wrote it`,
    sql: `select 'private.${name}(): ' || case
                 when p.oid is null then 'missing'
                 when not p.prosecdef then 'not security definer'
                 when p.provolatile <> 's' then 'not stable'
                 else 'body differs'
               end as violation
          from (select 1) as one
          left join (pg_proc p join pg_namespace n on n.oid = p.pronamespace)
            on n.nspname = 'private' and p.proname = '${name}'
          where p.oid is null or not p.prosecdef or p.provolatile <> 's'
             or regexp_replace(btrim(p.prosrc, E' \\n\\t'), '\\s+', ' ', 'g') <> '${collapsed(body)}'`,
  })),
  {
    // The auth server's role is the hook's only caller: any other holding
    // execute could ask it which emails are members'. A null ACL is the
    // default a create leaves behind, execute for everyone.
    name: `private.before_user_created() is callable by ${HOOK_ROLE}, who can see into private, and by nobody else`,
    sql: `select 'private.before_user_created(): '
                 || case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end
                 || ' holds execute' as violation
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          cross join lateral aclexplode(p.proacl) a
          where n.nspname = 'private' and p.proname = 'before_user_created'
            and a.grantee <> '${HOOK_ROLE}'::regrole and a.grantee <> p.proowner
          union all
          select 'private.before_user_created(): ' || case
                   when p.oid is null then 'missing'
                   when p.proacl is null then 'callable by everyone'
                   else '${HOOK_ROLE} cannot call it'
                 end as violation
          from (select 1) as one
          left join (pg_proc p join pg_namespace n on n.oid = p.pronamespace)
            on n.nspname = 'private' and p.proname = 'before_user_created'
          where p.oid is null or p.proacl is null
             or not has_function_privilege('${HOOK_ROLE}', p.oid, 'EXECUTE')
          union all
          select '${HOOK_ROLE} cannot see into private' as violation
          where not has_schema_privilege('${HOOK_ROLE}', 'private', 'USAGE')`,
  },
  {
    // The files live in R2, behind the files worker; nothing of the
    // household's is kept in Storage, so a bucket here is a place a file
    // could end up ungated.
    name: 'no storage bucket exists',
    sql: `select id as violation from storage.buckets`,
  },
  {
    // With no bucket there is nothing for a policy to gate, and one that
    // appears is an opening.
    name: 'no policy on storage.objects',
    sql: `select policyname as violation
          from pg_policies
          where schemaname = 'storage' and tablename = 'objects'`,
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
    console.error(`  \x1b[31m✗\x1b[0m ${check.name}`);
    for (const r of rows) console.error(`      → ${r.violation}`);
  }
}
await client.end();

if (failed > 0) {
  console.error(`\n\x1b[31mSecurity invariants FAILED: ${failed} check(s) violated.\x1b[0m`);
  process.exit(1);
}
console.log('\n\x1b[32mAll security invariants hold.\x1b[0m');
