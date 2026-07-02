-- ============================================================================
-- 0011_partnerships_tracker.sql — Partnerships Tracker table
-- Run in Supabase SQL Editor. Idempotent (safe to re-run).
-- ============================================================================

create table if not exists partnerships_tracker (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  position    text,
  contact     text,
  notes       text,
  to_be_done  text,
  updates     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for faster lookups
create index if not exists partnerships_tracker_name_idx on partnerships_tracker (name);
create index if not exists partnerships_tracker_created_at_idx on partnerships_tracker (created_at desc);

-- RLS
alter table partnerships_tracker enable row level security;

-- Allow anon SELECT (frontend reads)
do $$ begin
  create policy partnerships_tracker_anon_select
    on partnerships_tracker
    for select
    to anon
    using (true);
exception when duplicate_object then null; end $$;

-- Allow anon INSERT (for adding new items from frontend)
do $$ begin
  create policy partnerships_tracker_anon_insert
    on partnerships_tracker
    for insert
    to anon
    with check (true);
exception when duplicate_object then null; end $$;

-- Allow anon UPDATE (for editing notes/updates)
do $$ begin
  create policy partnerships_tracker_anon_update
    on partnerships_tracker
    for update
    to anon
    using (true);
exception when duplicate_object then null; end $$;

-- Allow anon DELETE
do $$ begin
  create policy partnerships_tracker_anon_delete
    on partnerships_tracker
    for delete
    to anon
    using (true);
exception when duplicate_object then null; end $$;

-- Realtime publication
do $$ begin
  alter publication supabase_realtime add table partnerships_tracker;
exception when duplicate_object then null; end $$;