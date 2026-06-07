-- Al Ain Campus Events — initial schema, RLS, storage, seed.
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Security model: default-deny. Department-scoped writes. RLS is the real guard.

-- ============================================================
-- Enums & helper
-- ============================================================
create type app_role as enum ('viewer', 'organizer', 'admin');
create type event_status as enum ('draft', 'published', 'archived');

-- ============================================================
-- Organizers (fixed seed list)
-- ============================================================
create table organizers (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  kind        text not null,
  sort_order  int not null default 0
);

-- ============================================================
-- Profiles (mirror of auth.users) — role + department scope
-- ============================================================
create table profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text,
  role               app_role not null default 'viewer',
  dept_organizer_ids uuid[] not null default '{}',
  created_at         timestamptz not null default now()
);

-- Convenience predicates (security definer so policies can call them)
create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function can_manage(org uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and (p.role = 'admin' or (p.role = 'organizer' and org = any(p.dept_organizer_ids)))
  );
$$;

-- ============================================================
-- Events
-- ============================================================
create table events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  organizer_id  uuid not null references organizers(id),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  location      text,
  poster_path   text,
  description   text,
  status        event_status not null default 'draft',
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ends_at >= starts_at)
);
create index events_org_starts_idx on events (organizer_id, starts_at);
create index events_status_starts_idx on events (status, starts_at);

-- ============================================================
-- Attendees / certificates / surveys / photos / annual reports
-- ============================================================
create table attendees (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  full_name     text not null,
  email         text,
  student_id    text,
  checked_in_at timestamptz
);
create index attendees_event_idx on attendees (event_id);

create table certificates (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  attendee_id uuid not null references attendees(id) on delete cascade,
  serial      uuid not null default gen_random_uuid() unique,  -- unguessable, not sequential
  pdf_path    text,
  issued_at   timestamptz not null default now()
);
create index certificates_event_idx on certificates (event_id);

create table surveys (
  id        uuid primary key default gen_random_uuid(),
  event_id  uuid not null references events(id) on delete cascade,
  schema    jsonb not null default '{}'::jsonb,
  open      boolean not null default true
);

create table survey_responses (
  id           uuid primary key default gen_random_uuid(),
  survey_id    uuid not null references surveys(id) on delete cascade,
  payload      jsonb not null,
  submitted_at timestamptz not null default now()
);

create table photos (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  path       text not null,
  caption    text,
  sort_order int not null default 0
);

create table annual_reports (
  id           uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references organizers(id),
  year         int not null,
  title        text not null,
  path         text not null,
  uploaded_by  uuid references auth.users(id),
  uploaded_at  timestamptz not null default now(),
  unique (organizer_id, year)
);

-- ============================================================
-- Row Level Security — enable + default deny on every table
-- ============================================================
alter table organizers      enable row level security;
alter table profiles        enable row level security;
alter table events          enable row level security;
alter table attendees       enable row level security;
alter table certificates    enable row level security;
alter table surveys         enable row level security;
alter table survey_responses enable row level security;
alter table photos          enable row level security;
alter table annual_reports  enable row level security;

-- organizers: readable by all authenticated users; only admin writes
create policy organizers_read on organizers for select to authenticated using (true);
create policy organizers_write on organizers for all to authenticated
  using (is_admin()) with check (is_admin());

-- profiles: a user sees their own; admin sees all; user cannot escalate role
create policy profiles_self_read on profiles for select to authenticated
  using (id = auth.uid() or is_admin());
create policy profiles_admin_write on profiles for all to authenticated
  using (is_admin()) with check (is_admin());

-- events: published readable by all; drafts only by managers of that org
create policy events_read on events for select to authenticated
  using (status = 'published' or can_manage(organizer_id));
create policy events_write on events for all to authenticated
  using (can_manage(organizer_id)) with check (can_manage(organizer_id));

-- attendees / certificates / photos / surveys: managers of the parent event only
create policy attendees_rw on attendees for all to authenticated
  using (can_manage((select organizer_id from events e where e.id = event_id)))
  with check (can_manage((select organizer_id from events e where e.id = event_id)));

create policy certificates_rw on certificates for all to authenticated
  using (can_manage((select organizer_id from events e where e.id = event_id)))
  with check (can_manage((select organizer_id from events e where e.id = event_id)));

create policy photos_read on photos for select to authenticated
  using (exists (select 1 from events e where e.id = event_id and (e.status = 'published' or can_manage(e.organizer_id))));
create policy photos_write on photos for all to authenticated
  using (can_manage((select organizer_id from events e where e.id = event_id)))
  with check (can_manage((select organizer_id from events e where e.id = event_id)));

create policy surveys_read on surveys for select to authenticated
  using (exists (select 1 from events e where e.id = event_id and (e.status = 'published' or can_manage(e.organizer_id))));
create policy surveys_write on surveys for all to authenticated
  using (can_manage((select organizer_id from events e where e.id = event_id)))
  with check (can_manage((select organizer_id from events e where e.id = event_id)));

-- survey responses: anyone authenticated may submit to an OPEN survey;
-- only event managers may read them back.
create policy survey_responses_insert on survey_responses for insert to authenticated
  with check (exists (select 1 from surveys s where s.id = survey_id and s.open = true));
create policy survey_responses_read on survey_responses for select to authenticated
  using (can_manage((select e.organizer_id from surveys s join events e on e.id = s.event_id where s.id = survey_id)));

-- annual reports: readable by all; admin writes
create policy annual_read on annual_reports for select to authenticated using (true);
create policy annual_write on annual_reports for all to authenticated
  using (is_admin()) with check (is_admin());

-- ============================================================
-- Auto-create a profile on signup (default viewer)
-- ============================================================
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

-- ============================================================
-- Storage buckets (all PRIVATE — served via short-TTL signed URLs)
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('posters', 'posters', false),
  ('photos', 'photos', false),
  ('attendance', 'attendance', false),
  ('certificates', 'certificates', false),
  ('annual-reports', 'annual-reports', false)
on conflict (id) do nothing;
-- NOTE: add storage.objects RLS policies per bucket keyed to can_manage()
-- in a follow-up migration when wiring uploads (build order step 5+).

-- ============================================================
-- Seed organizers (matches src/lib/organizers.ts)
-- ============================================================
insert into organizers (slug, name, kind, sort_order) values
  ('engineering', 'College of Engineering', 'college', 1),
  ('business', 'College of Business', 'college', 2),
  ('law', 'College of Law', 'college', 3),
  ('health-sciences', 'College of Health Sciences', 'college', 4),
  ('arts-education-social', 'College of Arts, Education & Social Sciences', 'college', 5),
  ('student-affairs', 'Student Affairs Department', 'department', 6),
  ('admission-registration', 'Admission & Registration', 'department', 7),
  ('innovation-center', 'Innovation Center', 'center', 8),
  ('academic-success', 'Academic Success Center', 'center', 9),
  ('library', 'Library', 'center', 10),
  ('campus-director', 'Campus Director Office', 'office', 11)
on conflict (slug) do nothing;
