-- ============================================================================
-- 0008_fix_rls_anon_select.sql — Allow anon SELECT on scanned_business_cards
-- Run in Supabase SQL Editor. Idempotent (safe to re-run).
-- ============================================================================

-- Allow anon (public) users to read scanned cards (the frontend uses anon key)
do $$ begin
  create policy scanned_cards_anon_select
    on scanned_business_cards
    for select
    to anon
    using (true);
exception when duplicate_object then null; end $$;
