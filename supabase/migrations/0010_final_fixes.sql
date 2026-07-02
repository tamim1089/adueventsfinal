-- ============================================================================
-- 0010_final_fixes.sql — All fixes in one script
-- Run in Supabase SQL Editor. Idempotent (safe to re-run).
-- ============================================================================

-- 1. Add missing columns
alter table scanned_business_cards
  add column if not exists website   text,
  add column if not exists address   text,
  add column if not exists phones    text[] not null default '{}',
  add column if not exists emails    text[] not null default '{}',
  add column if not exists socials   text[] not null default '{}',
  add column if not exists confidence numeric(4,3),
  add column if not exists scanned_at timestamptz not null default now();

-- 2. Dedup index
create unique index if not exists scanned_cards_email_phone_uniq
  on scanned_business_cards (lower(email), lower(phone))
  where email is not null and phone is not null;

-- 3. Enable Realtime publication (add our table to the existing publication)
do $$ begin
  alter publication supabase_realtime add table scanned_business_cards;
exception when duplicate_object then null; end $$;

-- 4. RLS — allow anon SELECT
alter table scanned_business_cards enable row level security;

drop policy if exists scanned_cards_admin_read on scanned_business_cards;

do $$ begin
  create policy scanned_cards_anon_select
    on scanned_business_cards
    for select
    to anon
    using (true);
exception when duplicate_object then null; end $$;
