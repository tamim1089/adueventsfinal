-- ============================================================================
-- 0003_phase1.sql — Backend foundation (Phase 1)
-- Run THIS ONE FILE on your Supabase project (SQL editor, or `supabase db push`).
-- Idempotent & safe to re-run. Supersedes 0002_certificates.sql.
-- Requires 0001_init.sql (tables, organizers seed, storage buckets) first.
-- ============================================================================

-- 1) events: public slug, audience, live attendance count, certificate fields
alter table events
  add column if not exists slug text unique,
  add column if not exists audience text not null default 'uni' check (audience in ('uni','external')),
  add column if not exists attending int not null default 0,
  add column if not exists certificate_description text,
  add column if not exists contact_hours text,
  add column if not exists certificate_signatory text not null default 'Dr. Mohammad Fteiha',
  add column if not exists certificate_signatory_title text not null default 'Campus Director — Al Ain Campus',
  add column if not exists certificate_template text not null default 'udl';

-- 2) schools directory (English, searchable) for external-event registration
create table if not exists schools (
  id          text primary key,
  name        text not null,
  name_ar     text,
  category    text,
  created_at  timestamptz not null default now()
);
alter table schools enable row level security;

-- 3) attendees: richer self-registration fields
alter table attendees
  add column if not exists audience      text,                        -- 'uni' | 'external'
  add column if not exists uni_id        text,                        -- university / student ID
  add column if not exists position      text,                        -- role in the university
  add column if not exists grade         text,                        -- external: school grade
  add column if not exists school_id     text references schools(id),
  add column if not exists registered_at timestamptz not null default now();

-- one registration per person (email) per event
create unique index if not exists attendees_event_email_uniq
  on attendees (event_id, lower(email)) where email is not null;

-- 4) public (anon) read — the public site uses the anon key, but 0001's
--    policies are authenticated-only. Add anon SELECT for published content.
do $$ begin
  create policy events_public_read on events for select to anon using (status = 'published');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy organizers_public_read on organizers for select to anon using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy schools_public_read on schools for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;

-- 5) certificate storage policy (managers; public downloads via signed URLs)
do $$ begin
  create policy certificates_obj_rw on storage.objects for all to authenticated
    using (bucket_id = 'certificates') with check (bucket_id = 'certificates');
exception when duplicate_object then null; end $$;

-- 6) seed demo events (match the current site) + one dummy EXTERNAL event.
--    Organizers are already seeded by 0001 (referenced by slug here).
insert into events (slug, title, organizer_id, starts_at, ends_at, location, description, poster_path, status, audience, attending, contact_hours, certificate_description)
values
  ('founders-funding-night', 'Founders & Funding Night',
    (select id from organizers where slug='innovation-center'),
    now(), now() + interval '2 hours', 'Auditorium A',
    'Pitch sessions, investor panels, and networking for student founders.',
    '/media/photos/MaleStudents_Together_On_a_Table_500x350-13.jpeg', 'published', 'uni', 210, '2 contact hours', null),
  ('robotics-showcase', 'Robotics Showcase',
    (select id from organizers where slug='engineering'),
    now() + interval '30 minutes', now() + interval '3 hours', 'Lab Building 2',
    'Senior projects and autonomous systems demos from the engineering labs.',
    '/media/photos/Student_Working_on_Machinecoe-landing2.jpg', 'published', 'uni', 156, '2 contact hours', null),
  ('research-skills-workshop', 'Research Skills Workshop',
    (select id from organizers where slug='library'),
    now() + interval '1 day', now() + interval '1 day 2 hours', 'Learning Commons',
    'Hands-on session on databases, citations, and literature reviews.',
    '/media/photos/TwoFemaleStudentsonatable_500x350-14.jpeg', 'published', 'uni', 88, '2 contact hours', null),
  ('industry-career-fair', 'Industry Career Fair',
    (select id from organizers where slug='admission-registration'),
    now() + interval '3 days', now() + interval '3 days 5 hours', 'Main Hall',
    'Meet employers across engineering, business, health, and law.',
    '/media/photos/StudentsWorkingtogetheronamachinecoe-landing3.jpg', 'published', 'uni', 540, null, null),
  ('schools-stem-open-day', 'Schools STEM Open Day',
    (select id from organizers where slug='engineering'),
    now() + interval '7 days', now() + interval '7 days 4 hours', 'Engineering Atrium',
    'A hands-on STEM day for Al Ain school students — robotics demos, lab tours, and campus life. Open to visiting schools.',
    '/media/photos/StudentsWorkingtogetheronamachinecoe-landing3.jpg', 'published', 'external', 0, '4 contact hours',
    'For attending the Schools STEM Open Day at Abu Dhabi University – Al Ain Campus.'),
  ('welcome-week-2026', 'Welcome Week 2026',
    (select id from organizers where slug='student-affairs'),
    now() - interval '7 days', now() - interval '6 days', 'Main Green',
    'Orientation, clubs fair, and guided tours for new students.',
    '/media/photos/StudentsWorkingtogetheronamachinecoe-landing3.jpg', 'published', 'uni', 1200, null, null),
  ('health-sciences-symposium', 'Health Sciences Symposium',
    (select id from organizers where slug='health-sciences'),
    now() - interval '14 days', now() - interval '14 days' + interval '6 hours', 'Auditorium B',
    'Guest lectures and poster sessions on public health research.',
    '/media/photos/TwoFemaleStudentsonatable_500x350-14.jpeg', 'published', 'uni', 320, null, null)
on conflict (slug) do nothing;

-- 7) schools seed (generated; English names) --------------------------------
insert into schools (id, name, category) values
  ('school-aaliya', 'AALIYA', 'Public'),
  ('school-abdullah-bin-zubair-private-school', 'Abdullah Bin Zubair Private school', 'Private'),
  ('school-abu-dhabi-island-school', 'Abu Dhabi Island School', 'Private'),
  ('school-ahmed-bin-zayed', 'AHMED BIN ZAYED', 'Public'),
  ('school-ain-al-khaleej-private-school', 'Ain Al Khaleej Private School', 'Private'),
  ('school-ain-al-khaleej-school', 'AIN AL KHALEEJ SCHOOL', 'Private'),
  ('school-al-adhwaa-private-school', 'Al Adhwaa Private School', 'Private'),
  ('school-al-adl', 'AL ADL', 'Public'),
  ('school-al-ain', 'AL AIN', 'Public'),
  ('school-al-ain-american-private-school', 'AL AIN AMERICAN PRIVATE SCHOOL', 'Private'),
  ('school-al-ain-american-school', 'Al Ain American School', 'Private'),
  ('school-al-ain-english-speaking-school', 'Al Ain English Speaking School', 'Private'),
  ('school-al-ain-juniors-private-school', 'Al Ain Juniors Private School', 'Private'),
  ('school-al-amirah-kg', 'Al Amirah KG', 'Public'),
  ('school-al-andalus-private-academy', 'AL ANDALUS PRIVATE ACADEMY', 'Private'),
  ('school-al-ataa', 'AL ATAA', 'Public'),
  ('school-al-awael-kg', 'AL AWAEL KG', 'Public'),
  ('school-al-awael-private-school', 'AL AWAEL PRIVATE SCHOOL', 'Private'),
  ('school-al-badiyah', 'AL BADIYAH', 'Public'),
  ('school-al-bedaa', 'AL BEDAA', 'Public'),
  ('school-al-borooj', 'AL BOROOJ', 'Public'),
  ('school-al-dahmaa', 'AL DAHMAA', 'Public'),
  ('school-al-danat', 'AL DANAT', 'Public'),
  ('school-al-dar-academy', 'Al Dar Academy', 'Private'),
  ('school-al-dar-private-school', 'AL DAR PRIVATE SCHOOL', 'Private'),
  ('school-al-dhafra-private-schools-al-ain', 'Al Dhafra Private Schools-Al Ain', 'Private'),
  ('school-al-dhahera', 'AL DHAHERA', 'Public'),
  ('school-al-diwan-kg', 'AL DIWAN KG', 'Public'),
  ('school-al-falah-school-al-khabisi', 'Al Falah School - Al Khabisi', 'Private'),
  ('school-al-falah-school-jimi', 'Al Falah School - Jimi', 'Private'),
  ('school-al-fouaah', 'AL FOUAAH', 'Public'),
  ('school-al-ghaf-charter-school', 'Al Ghaf Charter School', null),
  ('school-al-ghaith', 'AL GHAITH', 'Public'),
  ('school-al-hamdaniya-grand-private-school-llc', 'AL HAMDANIYA GRAND PRIVATE SCHOOL L.L.C.', 'Private'),
  ('school-al-hayar', 'AL HAYAR', 'Public'),
  ('school-al-hemmah', 'AL HEMMAH', 'Public'),
  ('school-al-hosson', 'AL HOSSON', 'Public'),
  ('school-al-israa-private-school', 'AL ISRAA PRIVATE SCHOOL', 'Private'),
  ('school-al-ittihad-national-private-school-al-ain', 'Al Ittihad National Private School - Al Ain', 'Private'),
  ('school-al-jahili', 'AL JAHILI', 'Public'),
  ('school-al-jimi-kg', 'AL JIMI KG', 'Public'),
  ('school-al-jood', 'AL JOOD', 'Public'),
  ('school-al-joori', 'Al Joori', 'Public'),
  ('school-al-khair', 'AL KHAIR', 'Public'),
  ('school-al-maali', 'AL MAALI', 'Public'),
  ('school-al-maqam', 'AL MAQAM', 'Public'),
  ('school-al-maseera', 'AL MASEERA', 'Public'),
  ('school-al-naeem', 'AL NAEEM', 'Public'),
  ('school-al-nahyaniyyah', 'AL NAHYANIYYAH', 'Public'),
  ('school-al-nebras', 'AL NEBRAS', 'Public'),
  ('school-al-quaa', 'AL QUAA', 'Public'),
  ('school-al-raqiah', 'AL RAQIAH', 'Public'),
  ('school-al-resalah', 'AL RESALAH', 'Public'),
  ('school-al-saad-indian-school-al-ain', 'Al Saad Indian School Al Ain', 'Private'),
  ('school-al-sadarah', 'AL SADARAH', 'Public'),
  ('school-al-salamat', 'AL SALAMAT', 'Public'),
  ('school-al-sanawbar-private-school', 'Al Sanawbar Private School', 'Private'),
  ('school-al-sariyah', 'AL SARIYAH', 'Public'),
  ('school-al-seddique-private-school', 'AL SEDDIQUE PRIVATE SCHOOL', 'Private'),
  ('school-al-shaheen', 'AL SHAHEEN', 'Public'),
  ('school-al-shiyam', 'AL SHIYAM', 'Public'),
  ('school-al-showaib', 'AL SHOWAIB', 'Public'),
  ('school-al-somou', 'AL SOMOU', 'Public'),
  ('school-al-tafawwoq-al-ain', 'AL TAFAWWOQ (AL AIN)', 'Public'),
  ('school-al-tafawwuq-al-ilmi-private-school', 'AL TAFAWWUQ AL ILMI PRIVATE SCHOOL', 'Private'),
  ('school-al-taleaa', 'AL TALEAA', 'Public'),
  ('school-al-tamayyoz', 'AL TAMAYYOZ', 'Public'),
  ('school-al-tawyah-kg', 'AL TAWYAH KG', 'Public'),
  ('school-al-tomooh', 'AL TOMOOH', 'Public'),
  ('school-al-wajan', 'AL WAJAN', 'Public'),
  ('school-al-yahar-kg', 'AL YAHAR KG', 'Public'),
  ('school-al-yahar-private-school-and-kindergarten', 'AL YAHAR PRIVATE SCHOOL and KINDERGARTEN', 'Private'),
  ('school-al-yaher-private-school', 'Al Yaher Private School', 'Private'),
  ('school-al-zayediyyah', 'AL ZAYEDIYYAH', 'Public'),
  ('school-al-zayediyyah-for-girls', 'AL ZAYEDIYYAH FOR GIRLS', 'Public'),
  ('school-al-dhafra-academy', 'Al- Dhafra Academy', 'Private'),
  ('school-ali-bin-abi-taleb', 'ALI BIN ABI TALEB', 'Public'),
  ('school-alkhalil-international-private-schools', 'ALKHALIL INTERNATIONAL PRIVATE SCHOOLS', 'Private'),
  ('school-american-national-school', 'American National School', 'Private'),
  ('school-atfal-al-hilal-kg', 'ATFAL AL HILAL KG', 'Public'),
  ('school-baraaim-al-ain-private-school', 'Baraaim Al Ain Private School', 'Private'),
  ('school-baraem-al-ain-private-schools', 'BARAEM AL AIN PRIVATE SCHOOLS', 'Private'),
  ('school-bin-ham', 'BIN HAM', 'Public'),
  ('school-bin-khaldoon-islamic-private-school', 'BIN KHALDOON ISLAMIC PRIVATE SCHOOL', 'Private'),
  ('school-brighton-college-al-ain', 'Brighton College Al Ain', 'Private'),
  ('school-bu-koreyya', 'BU KOREYYA', 'Public'),
  ('school-dar-al-uloom-private-school-falaj-hazza-branch', 'DAR AL ULOOM PRIVATE SCHOOL - FALAJ HAZZA BRANCH', 'Private'),
  ('school-darul-huda-islamic-school', 'Darul Huda Islamic School', 'Private'),
  ('school-emirates-falcon-international-private-school', 'Emirates Falcon International Private School', 'Private'),
  ('school-emirates-national-school', 'Emirates National School', 'Private'),
  ('school-emirates-national-schools', 'Emirates National Schools', 'Private'),
  ('school-emirates-private-school', 'Emirates Private School', 'Private'),
  ('school-first-lebanon-school-and-kindergarten-llc', 'FIRST LEBANON SCHOOL AND KINDERGARTEN -LLC', 'Private'),
  ('school-future-academy', 'Future Academy', 'Private'),
  ('school-future-international-school', 'Future International School', 'Private'),
  ('school-global-english-school', 'Global English School', 'Private'),
  ('school-grace-valley-indian-school', 'Grace Valley Indian School', 'Private'),
  ('school-hessa-bint-mohammad', 'HESSA BINT MOHAMMAD', 'Public'),
  ('school-hili', 'HILI', 'Public'),
  ('school-ibn-khaldoun-islamic-school', 'Ibn Khaldoun Islamic School', 'Private'),
  ('school-indian-school', 'Indian School', 'Private'),
  ('school-indian-school-alain', 'Indian school Alain', null),
  ('school-international-private-school', 'International Private School', 'Private'),
  ('school-international-school-of-choueifat-al-ain', 'International School of Choueifat - Al Ain', 'Private'),
  ('school-khaled-bin-al-waleed', 'KHALED BIN AL WALEED', 'Public'),
  ('school-khalifah-bin-zayed-al-ain', 'KHALIFAH BIN ZAYED (AL AIN)', 'Public'),
  ('school-lebanon-first-school-and-kindergarten-llc', 'LEBANON FIRST SCHOOL AND KINDERGARTEN -LLC', 'Private'),
  ('school-lebanon-the-first-private-school', 'Lebanon the First Private School', 'Private'),
  ('school-liwa-international-school-2nd-term', 'Liwa International School 2nd TERM', 'Private'),
  ('school-liwa-international-school-falaj-haza', 'LIWA international school falaj Haza', null),
  ('school-liwa-international-school-for-girls', 'Liwa International School for Girls', 'Private'),
  ('school-liwa-international-school-falaj-hazza', 'Liwa International School-Falaj Hazza', 'Private'),
  ('school-liwa-school-for-girls', 'Liwa School for girls', 'Private'),
  ('school-madar-international-school', 'Madar International School', 'Private'),
  ('school-manor-hall-private-school', 'Manor Hall Private School', 'Private'),
  ('school-maryam-bint-sultan', 'MARYAM BINT SULTAN', 'Public'),
  ('school-mbazzarah-al-khadra', 'Mbazzarah Al Khadra', 'Public'),
  ('school-mohammed-bin-khaled', 'MOHAMMED BIN KHALED', 'Public'),
  ('school-muraijib', 'MURAIJIB', 'Public'),
  ('school-nahel', 'NAHEL', 'Public'),
  ('school-nahyan-al-awal-kg', 'Nahyan Al Awal KG', 'Public'),
  ('school-neima', 'NEIMA', 'Public'),
  ('school-neima-c3-boys', 'Neima C3 Boys', 'Public'),
  ('school-new-indian-model-school', 'New Indian Model School', 'Private'),
  ('school-new-mezyad', 'NEW MEZYAD', 'Public'),
  ('school-newcentury-education', 'Newcentury Education', null),
  ('school-oasis-international-school', 'Oasis International School', 'Private'),
  ('school-our-own-english-high-school', 'Our Own English High School', 'Private'),
  ('school-pakistan-islamic-private-school', 'Pakistan Islamic Private School', 'Private'),
  ('school-palestine-private-academy-llc', 'PALESTINE PRIVATE ACADEMY L.L.C.', 'Private'),
  ('school-ramah', 'RAMAH', 'Public'),
  ('school-reefaa', 'REEFAA', 'Public'),
  ('school-scientific-distinction-private-school', 'Scientific Distinction Private School', 'Private'),
  ('school-shakhbout-bin-sultan', 'SHAKHBOUT BIN SULTAN', 'Public'),
  ('school-shamma-bint-mohammad', 'SHAMMA BINT MOHAMMAD', 'Public'),
  ('school-sheikha-bint-suroor', 'SHEIKHA BINT SUROOR', 'Public'),
  ('school-sultan-bin-zayed', 'SULTAN BIN ZAYED', 'Public'),
  ('school-tahnoon-bin-mohammad', 'TAHNOON BIN MOHAMMAD', 'Public'),
  ('school-tawam-private-model-school', 'TAWAM PRIVATE MODEL SCHOOL', 'Private'),
  ('school-the-gulf-international-private-academy', 'The Gulf International Private Academy', 'Private'),
  ('school-tifel-al-emarat-kg', 'TIFEL AL EMARAT KG', 'Public'),
  ('school-tolerance-schools-al-mutarid', 'Tolerance Schools - Al Mutarid', 'Public'),
  ('school-um-al-emarat-al-ain', 'UM AL EMARAT (AL AIN)', 'Public'),
  ('school-um-al-fadhel-bint-al-hareth', 'UM AL FADHEL BINT AL HARETH', 'Public'),
  ('school-um-ghafa', 'UM GHAFA', 'Public'),
  ('school-um-ghafa-kg', 'UM GHAFA KG', 'Public'),
  ('school-um-kolthoom', 'UM KOLTHOOM', 'Public'),
  ('school-united-school-of-al-yahar', 'United School of Al Yahar', 'Private'),
  ('school-universal-private-school-llc', 'UNIVERSAL PRIVATE SCHOOL L.L.C.', 'Private'),
  ('school-zakher-private-school', 'ZAKHER PRIVATE SCHOOL', 'Private'),
  ('school-zakher-private-school-al-ain', 'Zakher Private School, Al Ain', null),
  ('school-zayed-al-awal', 'ZAYED AL AWAL', 'Public')
on conflict (id) do nothing;
