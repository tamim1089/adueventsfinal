-- ============================================================================
-- 0007_realtime_scanned_cards.sql — Enable Supabase Realtime for the
-- scanned_business_cards table so the frontend receives live updates when
-- new cards are inserted by the WhatsApp ingestion pipeline.
-- Run in the Supabase SQL Editor. Idempotent.
-- ============================================================================

-- 1) Ensure the publication exists (idempotent — CREATE OR REPLACE would
--    drop + recreate, which resets the table list. Use DO + exception guard.)
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end $$;

-- 2) Add scanned_business_cards to the publication if not already present.
--    pg_publication_tables is a view, so we check by querying it.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'scanned_business_cards'
  ) then
    alter publication supabase_realtime add table public.scanned_business_cards;
  end if;
end $$;

-- 3) Enable replica identity FULL so the changed record is sent in full
--    (needed by the frontend to read the inserted row without a follow-up fetch).
alter table scanned_business_cards replica identity full;
