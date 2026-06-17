-- ============================================================================
-- 0005_media_online.sql — event media (banner + gallery), online events, and
-- certificate email tracking. Run this ONE file in the Supabase SQL Editor
-- (after 0000_setup.sql). Idempotent.
-- ============================================================================

-- events: hosting mode + online meeting + banner image
alter table events
  add column if not exists mode text not null default 'in_person' check (mode in ('in_person','online')),
  add column if not exists meeting_url text,
  add column if not exists meeting_sent_at timestamptz,        -- when the invite was emailed
  add column if not exists banner_path text;                   -- single hero image (posters bucket)

-- certificates: track emailing
alter table certificates
  add column if not exists sent_at timestamptz,
  add column if not exists email   text;

-- Make poster + photo buckets public-read (banners/galleries shown on the site)
update storage.buckets set public = true where id in ('posters', 'photos');

-- storage.objects policies: anyone can READ posters/photos; signed-in
-- managers can WRITE to posters/photos/attendance.
do $$ begin
  create policy media_public_read on storage.objects for select
    using (bucket_id in ('posters', 'photos'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy media_write on storage.objects for insert to authenticated
    with check (bucket_id in ('posters', 'photos', 'attendance'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy media_update on storage.objects for update to authenticated
    using (bucket_id in ('posters', 'photos', 'attendance'))
    with check (bucket_id in ('posters', 'photos', 'attendance'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy media_delete on storage.objects for delete to authenticated
    using (bucket_id in ('posters', 'photos', 'attendance'));
exception when duplicate_object then null; end $$;

-- photos: allow public read of gallery rows (so the public event page lists them)
do $$ begin
  create policy photos_public_read on photos for select to anon using (true);
exception when duplicate_object then null; end $$;
