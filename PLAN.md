# Build plan — media, calendar, photos, online events, certs, hero slide, perf

## A. Manual steps you'll do (I'll tell you exactly when)
1. **Run one SQL file** `supabase/migrations/0005_media_online.sql` (storage upload policies for `posters`/`photos`, make those two buckets public-read, + events `mode`/`meeting_url`/`banner_path`, + certificate `sent_at`/`email`).
2. **Resend key** (for emailing certs + meeting links):
   - Go to **resend.com** → sign up free → **API Keys → Create API Key** → copy.
   - **Paste it here**; I add `RESEND_API_KEY` to `.env.local`. You add the same on **Netlify → Environment variables**.
   - Sender defaults to `onboarding@resend.dev` (works immediately); later you can verify an `adu.ac.ae` domain in Resend for a branded sender.
3. **Fast “precompiled” local run** (no per-route compile lag): I'll switch you from `npm run dev` to `npm run build && npm run start`. Pages are prebuilt → instant. (I'll run it for you.)

## B. Phases (functionality first)

### Phase 1 — Perf: precompiled local
Stop `next dev`; run `next build` then `next start` on :3001. Document a one-command script. (Dev only compiles on demand — prod is fully precompiled and fast.)

### Phase 2 — Schema (0005) + storage
- `events`: `mode text default 'in_person' check in ('in_person','online')`, `meeting_url text`, `banner_path text`.
- `certificates`: `sent_at timestamptz`, `email text`.
- Make `posters` + `photos` buckets **public-read**; add `storage.objects` policies so signed-in managers can upload/delete in `posters`, `photos`, `attendance`.
- (Gallery rows use the existing `photos` table; banner uses `events.banner_path`.)

### Phase 3 — Event media management (in edit)
- **Banner image** (one): a dedicated uploader at the top of the edit page → uploads to `posters` bucket → sets `events.banner_path`. Replace/remove. This is the event's hero image on the public site.
- **Gallery media** (many): an "Event media" manager below → upload multiple → `photos` bucket + a `photos` row each; grid with delete + drag-reorder + caption. Clear visual split: **Banner** (single, framed 16:9) vs **Gallery** (grid of thumbnails).
- Public event page shows banner as hero + a gallery section.

### Phase 4 — Photos page = real gallery
- Group all media **by event** (and an "Unassigned/Campus" group). Each group = a titled section with a responsive thumbnail grid.
- Upload into any event, delete, set caption, set as banner. Empty state with an upload button (fixes the "just a count box, can't upload" problem).

### Phase 5 — Calendar redesign
- Fill the page (taller day cells, real week height), not a thin bar with empty space below.
- Each event = a **colored rounded rectangle** (color derived from its organizer — a fixed palette), title + time, click → edit.
- Optional month toggle later; week view first, bigger and balanced.

### Phase 6 — Online vs in-person + Teams
- Event form: **Mode** = In person (→ Venue field) OR Online (→ **Teams meeting link** + the date already on the event).
- On create (or an **"Send invite"** button you approve), email all registrants the meeting link + date via Resend. Status shown ("invite sent").
- Public/registration shows "Online — link sent on registration" vs venue.

### Phase 7 — Certificates by email (Resend)
- On an event's admin page: a **registrants table** (name, email, ID/position or grade/school, registered date).
- A **"Send certificates"** button (enabled once event ended + `RESEND_API_KEY` set): renders each PDF, stores it, emails each attendee, marks `sent_at`. Re-send safe. No more instant download on registration.

### Phase 8 — Font / UX pass (whole site + dashboard)
- Bump the many tiny labels (calendar times, table headers, meta) to readable sizes; increase row height/padding; friendlier spacing; keep the editorial system. Apply the UI/UX rules (hierarchy, hit targets ≥40px, breathing room).

### Phase 9 — Hero horizontal slide (the big one)
- The very first screen becomes a **pinned horizontal scroller**:
  - **Slide 1** = current hero (uni photo + logo + title + buttons).
  - Scrolling down **translates the whole frame left** to **Slide 2** (e.g., live highlights / "what's on").
  - After Slide 2, continued scrolling **releases** and the page scrolls **down** normally into the rest.
- Built with a sticky section whose height = (#slides × viewport), `useScroll` mapping scroll progress → `translateX`, then unpins. Respects reduced-motion (falls back to stacked). Mobile: simpler (no hijack).

## C. Notes
- Storage uploads need Phase 2 SQL first; cert/meeting emails need the Resend key.
- I'll `npm run build` + `npm run lint` after each phase, push, and serve the precompiled build so it's fast for you.
