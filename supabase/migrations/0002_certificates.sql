-- 0002_certificates.sql
-- Per-event certificate fields, a public slug for lookup, and an idempotent
-- attendee guard. Apply with `supabase db push` (or paste in the SQL editor)
-- once events live in the database. See DEPLOY.md → "Certificates".

alter table events
  add column if not exists slug text unique,                                   -- public lookup key (matches the static slugs)
  add column if not exists certificate_description text,                        -- body under the recipient name (per event)
  add column if not exists contact_hours text,                                  -- optional, e.g. "2 contact hours"
  add column if not exists certificate_signatory text not null default 'Dr. Mohammad Fteiha',
  add column if not exists certificate_signatory_title text not null default 'Campus Director — Al Ain Campus',
  add column if not exists certificate_template text not null default 'udl';

-- One certificate per person per event; case-insensitive email guard.
create unique index if not exists attendees_event_email_uniq
  on attendees (event_id, lower(email)) where email is not null;

-- Issued certs are readable/writable by authenticated event managers; public
-- downloads happen via short-TTL signed URLs minted server-side (service role).
create policy certificates_obj_rw on storage.objects for all to authenticated
  using (bucket_id = 'certificates') with check (bucket_id = 'certificates');
