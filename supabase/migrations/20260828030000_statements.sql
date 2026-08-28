-- =============================================================================
-- Migration: statements and merchant rules (offline-first) — the Gastos app.
--
-- A statement is one credit-card bill as the bank issued it, read on the
-- device from the PDF. The row keeps in the clear only what lists it and
-- announces its due date: the layout it was read with (`format`), its closing
-- and due dates and its two totals. Everything the bill says — every
-- purchase, who made it, the installments still to come — travels in
-- `payload`: the parsed bill, compressed, then encrypted on the device under a
-- key of its own that `wrapped_key` holds wrapped under the household's master
-- key, exactly as an attachment's file is. A few KB, small enough to live in
-- the row and be pulled with the table.
--
-- A merchant rule files every purchase whose merchant contains `pattern`
-- under `category`. The pattern names where the household shops, so it is
-- encrypted the same way; the category is one of the app's fixed set and
-- says nothing on its own.
--
-- No uniqueness on (format, closed_on): the app offers to replace a statement
-- already imported, and a constraint would make a queued push fail for good.
--
-- Same security model as every other table: RLS on, a single
-- private.is_member() policy, CRUD granted to `authenticated` only (never
-- `anon`). Offline-first specifics (client-supplied uuid, client-owned
-- `updated_at`, the last_write_wins trigger) as in the dates migration.
-- =============================================================================

create table statements (
  id uuid primary key default gen_random_uuid(),
  format text not null check (length(format) > 0),
  closed_on date not null,
  due_on date not null,
  total_ars_cents bigint not null,
  total_usd_cents bigint not null,
  wrapped_key text not null,
  payload text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table statements enable row level security;

create policy "Members have full access to statements" on statements
  for all to authenticated using (private.is_member()) with check (private.is_member());

revoke all on public.statements from anon, authenticated;
grant select, insert, update, delete on public.statements to authenticated;

create trigger last_write_wins before update on public.statements
  for each row execute function private.last_write_wins();

create table merchant_rules (
  id uuid primary key default gen_random_uuid(),
  wrapped_key text not null,
  pattern text not null,
  category text not null check (length(category) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table merchant_rules enable row level security;

create policy "Members have full access to merchant rules" on merchant_rules
  for all to authenticated using (private.is_member()) with check (private.is_member());

revoke all on public.merchant_rules from anon, authenticated;
grant select, insert, update, delete on public.merchant_rules to authenticated;

create trigger last_write_wins before update on public.merchant_rules
  for each row execute function private.last_write_wins();
