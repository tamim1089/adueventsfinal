# ADU Al Ain Events — Feature Roadmap

A grounded, prioritized backlog of real features on the existing skeleton.
(Not a padded list — every item is something that adds genuine value.)
Status: ✅ done · ◻️ todo

## 0. Done so far
- ✅ Public site: hero (horizontal self-slide), live events, organizers, features, CTA, footer
- ✅ EmpowerED Series page (real 15-session programme + 2 featured posters)
- ✅ Partners & MoUs (grouped squares, contact in box, favicons)
- ✅ Events list + detail (DB-backed), search
- ✅ Registration (conditional ADU/school, searchable schools, mobile bottom-sheet)
- ✅ Admin: auth gate, overview, events CRUD, week calendar, attendance, certificates (email via Resend), surveys/reports stubs, **photos manager (upload/crop/resize/delete/set-banner)**
- ✅ Backend: Supabase schema, schools dir, data layer w/ fallback, precompiled local serving
- ✅ Branding: black/red emblem favicon + logos, minimalist tab titles

## A. Event content & media (high value)
- ◻️ A1. Banner + gallery manager **inside the event edit page** (not just /photos)
- ◻️ A2. Public event detail: show banner as hero + a real photo gallery (lightbox)
- ◻️ A3. Poster upload on event create/edit (separate from gallery)
- ◻️ A4. Drag-reorder gallery photos; per-photo caption editing
- ◻️ A5. Online vs in-person on the form: Teams link field + "email link to registrants"

## B. Registration & attendance
- ◻️ B1. Capacity / seats-left per event; "Full" state
- ◻️ B2. Attendance CSV import (the `attendance` bucket already exists)
- ◻️ B3. QR check-in (mark `checked_in_at`)
- ◻️ B4. Per-attendee resend / revoke certificate
- ◻️ B5. Export registrants to CSV/Excel

## C. Certificates
- ◻️ C1. Verify domain in Resend → real delivery to all attendees (manual + wiring)
- ◻️ C2. Public verify page `/certificates/[serial]` (QR on the PDF)
- ◻️ C3. Multiple certificate templates per event
- ◻️ C4. Bulk issue for an imported attendee list

## D. Surveys (currently a stub)
- ◻️ D1. Survey builder (questions: text / rating / multiple-choice)
- ◻️ D2. Public survey page per event (post-event link)
- ◻️ D3. Responses dashboard + simple charts + CSV export

## E. Reports & annual reports (currently a stub)
- ◻️ E1. Per-event report → PDF/Excel (registrations, attendance, certs, survey summary)
- ◻️ E2. Annual report upload per organizer (the `annual-reports` bucket exists) + public page

## F. Partners
- ◻️ F1. Wire the **real logo files** you dropped in the repo root into the squares
- ◻️ F2. Partner search/filter; "add partner" admin form
- ◻️ F3. MoU document attach + expiry tracking

## G. Public polish & UX
- ◻️ G1. Organizer pages: `/organizers/[slug]` listing that org's events
- ◻️ G2. Event filters by date/organizer on /events; calendar view for the public
- ◻️ G3. Light/dark toggle; warm dark palette
- ◻️ G4. Arabic (RTL) full localization toggle

## H. Platform / infra
- ◻️ H1. Netlify env vars + production smoke test (manual)
- ◻️ H2. Role management UI (admin assigns organizer scope)
- ◻️ H3. Audit log of admin actions
- ◻️ H4. Email notifications (new registration → organizer)

## Manual steps you own (I can't)
- Run any new SQL files I add (Supabase SQL editor)
- Verify a domain in Resend for real cert/email delivery to attendees
- Add the 4 env vars on Netlify + trigger deploy
- Provide partner logo → company name mapping (if not obvious)
