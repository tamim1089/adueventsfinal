-- ============================================================================
-- 0009_add_missing_columns.sql — Add columns that should have been in 0006
-- Run in Supabase SQL Editor. Idempotent (safe to re-run).
-- ============================================================================

alter table scanned_business_cards
  add column if not exists website   text,
  add column if not exists address   text,
  add column if not exists phones    text[] not null default '{}',
  add column if not exists emails    text[] not null default '{}',
  add column if not exists socials   text[] not null default '{}',
  add column if not exists confidence numeric(4,3),
  add column if not exists scanned_at timestamptz not null default now();

-- Deduplication: same primary email+phone pair → upsert target
create unique index if not exists scanned_cards_email_phone_uniq
  on scanned_business_cards (lower(email), lower(phone))
  where email is not null and phone is not null;
