# Final build plan — functionality first, then design

Goal: a real working version. Order = **make it live → dashboard works → calendar/conflicts → registration → design polish.**

## What you must do (inputs only you can do)
1. **Run SQL** in Supabase SQL Editor: `supabase/migrations/0003_phase1.sql`, then the new `0004_phase2.sql` I'll add in Phase 1. (I can't run DDL with an API key.)
2. **Create a login user**: Supabase → Authentication → Users → Add user (email + password, Auto-Confirm). Then run this once in SQL editor to make it an admin:
   `update profiles set role='admin' where id=(select id from auth.users where email='YOUR_EMAIL');`
   → that email+password is your dashboard login.
3. **Env vars on Netlify** (Site config → Environment variables): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `RESEND_API_KEY` (from resend.com, free). Local `.env.local` already has the 3 Supabase ones; I'll add RESEND there too once you give it.

## Phase 1 — Go live + login works
- Add `0004_phase2.sql`: event time/venue **conflict guard** (no overlapping events in the same venue), certificate send-tracking (`certificates.sent_at`, `email`), and any missing columns.
- Flip all reads to the DB via `lib/data.ts` (already built, with static fallback): home, `/events`, `/events/[slug]`, admin. Handle existing rows without slugs (auto-skip/generate).
- Confirm the auth gate (`/admin` → `/admin/login`) and that your created user logs in.

## Phase 2 — Dashboard: everything works
- **Auth + session**: real sign-in/out; show the logged-in user.
- **Sidebar pages, all functional**: Overview, Events (list + create/edit/delete with poster/date/time/location/audience/cert description), Attendance (view registrants, import CSV), Certificates, Surveys (create + responses), Photos (upload to bucket), Reports (per-event export), Annual reports (per dept upload). Every sidebar link routes to a real page.
- **Search** (top bar): searches events/attendees, navigates to them.
- **Notifications**: a working dropdown (recent registrations / upcoming events).
- **Certificates flow change (your ask):** registration does **NOT** download a cert. On an event's dashboard page, once it has ended, a **"Send certificates"** action renders each attendee's PDF, stores it, and **emails it via Resend**. Shows sent status; re-send safe.
- Real KPI numbers from the DB; "New event" works.

## Phase 3 — Weekly calendar (sidebar) + conflict prevention
- New sidebar item **"Calendar"**: a wide Mon–Sun week view, every event on its day/time; click → the **admin** event detail (editable), not the public page.
- **Conflict prevention**: creating/editing an event that overlaps another in the same venue/time is blocked (DB guard + clear UI error).

## Phase 4 — Registration (legit, conditional, mobile)
- Replace the plain popover with a proper form that **slides up from the bottom as a draggable sheet on mobile** (dismiss by swiping down), a centered dialog on desktop.
- **Uni events** → require ID + full name + position in uni. **External events** → require full name + grade + **pick your school** (searchable, from the 152-school DB, English). A **dummy external event** ("Schools STEM Open Day") is already seeded for the demo.
- Submitting records the attendee in Supabase (no cert download). Confirmation screen only.

## Phase 5 — Public design polish
- **Hero horizontal intro**: the uni-entrance slide is first; scrolling slides **left** to a second slide, *then* continues vertically.
- **Partners → logo-cloud grid** (your paste): bordered cells with plus-marks; square logos in square cells, wide ones arranged; **companies only — no Arabic, no people names**; hover shows basic contact info.
- **Nav**: add an **"Empowered Ed Series"** item + a dummy page for it (icon included).
- **Hero buttons**: more gap between label and the chevron (they're too close now).
- **Socials** (footer): real ADU links — youtube.com/@AbuDhabiUni, instagram.com/abudhabiuni, x.com/abudhabiuni, linkedin.com/school/abu-dhabi-university.
- Final sweep: confirm no tiny all-caps remain; bigger nav already done.

## Notes
- Already done in prior turns: all-caps sweep, bigger nav + icons + hover, animated hero buttons, no text-selection, partners directory (will be reworked into the logo cloud), backend foundation SQL + schools DB + data layer.
- Dependencies to add: `resend` (email), `@radix-ui/react-dialog` or a drag sheet lib for the registration sheet.
- I'll run `npm run build` + `npm run lint` after each phase and push.
