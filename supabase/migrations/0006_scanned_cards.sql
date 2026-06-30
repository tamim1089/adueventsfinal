-- ============================================================================
-- 0006_scanned_cards.sql — Business card scanner storage
-- Run in Supabase SQL Editor. Idempotent (safe to re-run).
-- ============================================================================

create table if not exists scanned_business_cards (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  title       text,
  company     text,
  email       text,
  phone       text,
  website     text,
  address     text,
  phones      text[]  not null default '{}',
  emails      text[]  not null default '{}',
  socials     text[]  not null default '{}',
  raw_text    text,
  confidence  numeric(4,3),          -- 0.000 – 1.000
  scanned_at  timestamptz not null default now()
);

-- Deduplication: same primary email+phone pair → upsert target
create unique index if not exists scanned_cards_email_phone_uniq
  on scanned_business_cards (lower(email), lower(phone))
  where email is not null and phone is not null;

-- RLS: enable, then allow anon INSERT only (no reads via anon key)
alter table scanned_business_cards enable row level security;

do $$ begin
  create policy scanned_cards_anon_insert
    on scanned_business_cards
    for insert
    to anon
    with check (true);
exception when duplicate_object then null; end $$;

-- Authenticated admin users can read all scanned cards
do $$ begin
  create policy scanned_cards_admin_read
    on scanned_business_cards
    for select
    to authenticated
    using (is_admin());
exception when duplicate_object then null; end $$;
