# Al Ain Campus Events — Build Coordination

Single source of truth. Every decision about UX, state, security, and performance lives here.
Read this before touching code. If code and this file disagree, fix one of them on purpose.

Stack: Next.js 16 (App Router, RSC) · Supabase (Postgres + Storage + Auth) · Tailwind · TypeScript.
Target: web, desktop-first but responsive to phone. Internal ADU tool, authenticated.

---

## 1. Value order (never reorder)

1. **Legibility & correctness** — event dates, locations, attendance, certificate names must be
   exact and unmistakable. If an effect hurts reading, the effect loses.
2. **Speed & predictability** — pages load fast, actions give instant feedback, nothing jumps.
3. **Beauty (liquid glass)** — last. Servant of 1 and 2. Drop it on any element where it costs legibility.

---

## 2. Roles & access (drives everything below)

| Role | Can |
|------|-----|
| `viewer` | Browse events, view posters/photos/reports (public-ish, still logged in) |
| `organizer` | Create/edit events for **their own** department, upload posters/attendance/photos, generate certs, build surveys, see reports |
| `admin` | All of the above across all departments, manage users, upload annual reports |

Department is an attribute on the user. An organizer is scoped to one (or more) of the 11 organizers.
This scoping is enforced in the database (RLS), not just the UI. UI hiding is convenience, not security.

The 11 organizers (seed data, fixed list):
Engineering · Business · Law · Health Sciences · Arts/Education/Social Sciences · Student Affairs ·
Admission & Registration · Innovation Center · Academic Success Center · Library · Campus Director Office.

---

## 3. Data model (Postgres / Supabase)

```
organizers       id, slug, name, sort_order
profiles         id(=auth.uid), full_name, role, dept_organizer_ids[]   -- mirrors auth.users
events           id, title, organizer_id, starts_at, ends_at, location,
                 poster_path, description, status(draft|published|archived),
                 created_by, created_at, updated_at
attendees        id, event_id, full_name, email, student_id, checked_in_at
certificates     id, event_id, attendee_id, serial(unique), pdf_path, issued_at
surveys          id, event_id, schema(jsonb), open(bool)
survey_responses id, survey_id, payload(jsonb), submitted_at
photos           id, event_id, path, caption, sort_order
reports          generated on demand (no table) OR cached: id, event_id, kind, path
annual_reports   id, organizer_id, year, title, path, uploaded_by, uploaded_at
```

Indexes that matter: `events(organizer_id, starts_at)`, `events(status, starts_at)`,
`attendees(event_id)`, `certificates(event_id)`. "Currently running / overlapping" =
`starts_at <= now() AND ends_at >= now()` — covered by the `(status, starts_at)` index + filter.

Storage buckets (all **private**, served via signed URLs):
`posters` · `photos` · `attendance` (raw uploads) · `certificates` · `annual-reports`.

---

## 4. App states (handle all five for every data view — no exceptions)

For each screen that loads data, define: **loading · empty · error · partial · ready**.
- **loading** — skeleton, not a spinner-on-blank. Reserve layout height so nothing shifts (CLS).
- **empty** — a real message + the primary action ("No events yet — Create one").
- **error** — what failed + a retry. Never a blank glass card.
- **partial** — list loaded, one image 404s → placeholder, not a broken layout.
- **ready** — the real thing.

Auth states: signed-out → login. Signed-in but no role → "pending access" page. Role mismatch on an
action → 403 page, not a silent no-op. Session expiry → redirect to login, preserve return URL.

Mutations: optimistic only where safe (reorder photos). For money-adjacent / record-of-truth actions
(issuing certificates, finalizing attendance) — pessimistic, show pending, confirm on server response.

---

## 5. Security (enforced, not decorative)

- **RLS on every table.** Default deny. Read policies by role + department; write policies require
  `organizer` of that dept or `admin`. Never rely on the client to scope data.
- **Service-role key is server-only.** Lives in `.env.local`, used only in Route Handlers / Server
  Actions / RSC — never imported into a `"use client"` file. Anon key is the only thing in the browser.
- **File uploads:** validate MIME + extension + size server-side. Posters/photos: images only, ≤10MB.
  Attendance: csv/xlsx only. Store under `{bucket}/{event_id}/{uuid}` — never trust client filenames.
  Strip EXIF from photos. Generate certificates server-side; serial is unguessable (uuid/random), not sequential.
- **Signed URLs** for all private files, short TTL (e.g. 1h). No public bucket for anything with names on it
  (attendance, certificates contain PII).
- **PII:** attendee names/emails/student IDs are personal data. Access logged via RLS scope; exports
  (reports/certs) only by organizer of that event or admin.
- **Headers:** CSP (no inline script except hashed), `X-Frame-Options: DENY`, HSTS, referrer-policy.
  Set in `next.config` headers or middleware.
- **Input:** validate every form server-side with a schema (zod). Client validation is UX only.
- **Survey responses** can be anonymous but rate-limit + size-cap the payload to prevent abuse.

---

## 6. Performance & speed (no bloat)

- **RSC by default.** Fetch data in Server Components; ship `"use client"` only for interactive leaves
  (forms, the glass nav, image lightbox). Keep the client bundle small.
- **Images:** `next/image` for posters/photos — automatic resize, lazy-load, modern formats. Thumbnails
  in lists, full-res only in detail/lightbox. Never blur a real photo to "make it glass" — blur a cheap copy.
- **Backdrop-filter is GPU-cost.** Limit live `backdrop-filter` to chrome (nav, sheets, sticky header) —
  a handful of layers, not every card. Cards use the **faux-glass floor** (tint + rim + shadow, no blur)
  so a list of 50 events doesn't melt the GPU. This is also the Reduce-Transparency fallback (free win).
- **Pagination / windowing** on event lists and attendee tables. Don't fetch 2000 attendees to render 20.
- **Caching:** static organizer list cached hard. Event lists revalidate on write. Signed URLs cached
  client-side until near TTL.
- **No font bloat:** one variable font (e.g. Inter via `next/font`, self-hosted, subset). No icon font —
  use an SVG icon set, tree-shaken. No CSS-in-JS runtime; Tailwind only.
- Target: list pages interactive < 1s on campus wifi; no layout shift (CLS ≈ 0).

---

## 7. Liquid glass — web adaptation

Skill principles hold; the platform is CSS. **§0 value order and §3 anti-patterns are law.**

**The recipe per surface (web):**
- **Backdrop blur, never content blur.** `backdrop-filter: blur()` on the surface blurs *what's behind*
  it — correct by default in CSS (unlike Flutter). NEVER put `filter: blur()` on a node containing text (A1).
- **Luminosity-preserving tint:** the surface fill is the brand/neutral hue at 8–16% alpha over the blur —
  not a flat dark `rgba(0,0,0,.5)` (that's mud, A3).
- **Specular rim:** 0.5–1px hairline, bright top-left → faint bottom-right. Implement as a
  `border` + an inset `box-shadow` highlight, or a masked gradient border. One light direction (~135°) app-wide.
- **Depth:** real `box-shadow` (y+8, blur 24, black 30–40%). Glass floats above content, never inlaid.
- **Continuous corners:** radius 8/16/20/28; inner = outer − padding.
- **Over a rich dark background** — deep gradient (`bg.base` → gradient stops) or a dark campus photo.
  Glass over flat white or a busy logo tile dies (A2). The app canvas is dark by default.

**Where glass goes:** floating nav, sticky page header, sheets/modals, the active filter pill.
**Where it does NOT:** dense data tables (attendance, reports) — those are solid, high-contrast surfaces.
Read-critical data is never on translucent fill (A7).

---

## 8. Tokens (define once in CSS vars / Tailwind theme — never hand-pick in components)

```
bg.base #0B0F14   bg.gradTop #11161D   bg.gradBottom #070A0E
brand.accent <FROM ADU LOGO>   brand.accentOn #FFFFFF
text.primary #F4F7FA (100%)   text.secondary #AAB4C0 (~70%)   text.tertiary #6B7682 (~40%)
success #2FBF71   warning #E8A317   danger #E5484D

glass.tint   brand/neutral @ 8–16% alpha (luminosity-preserving)
glass.rim    #FFF @60% (top-left) → #FFF @18% → transparent
glass.blur   chrome 24 · sheet 18 · control 10  (px)
glass.shadow 0 8px 24px rgba(0,0,0,.35)

radius 8/16/20/28 (continuous)   space 4 8 12 16 24 32 48
control height 44–52   touch target ≥44px (web pointer; ≥48 on touch)   padding card 16 · panel 24

opacity tiers: 100% vital (text, dates, CTAs, badges) · 70% supporting · 40% dividers/decor · 20% atmosphere
motion: 100/200/300ms · spring for press (scale .97) & active-pill morph
```

ADU brand accent: pull the exact hue from `Abu_Dhabi_University.png` in the home dir before finalizing.

---

## 9. Feature → screen map

| Requested feature | Screen / mechanism |
|---|---|
| Sort/navigate by organizer | Home: glass filter pills (11 organizers) + event grid, deep-link `/?org=engineering` |
| Upload poster + date/time/location | Event create/edit form, `next/image` poster, datetime + location fields |
| Upload attendance list | Event detail → attendance tab, CSV/XLSX upload → parsed into `attendees` |
| Auto-generate + share certificates | Per-event "Issue certificates" → server PDF gen → signed-URL share / email |
| Post-event survey | Survey builder (jsonb schema) + public response page, results in event detail |
| Upload post-event photos | Event detail → gallery, drag-reorder, lightbox |
| Download reports | Event report (attendance count, survey summary) → PDF/CSV export |
| Currently running / overlapping | Home "Happening now" section: `starts_at ≤ now ≤ ends_at` |
| Annual report per dept/college | `/reports/annual` — admin upload, per-organizer + year browse |

---

## 10. Pre-ship QA gate (screenshot is the proof, not the code)

Per screen, on a real render at phone and desktop width:
- [ ] Every label/date/number on a glass surface is sharp and readable (not blurred — A1).
- [ ] No text wraps mid-word or one letter per line; row labels are `truncate` + flex (A5).
- [ ] Nothing clipped by viewport edge or a sticky bar; bottom chrome respects safe area (A6).
- [ ] Correct at <600px (stack) and ≥600px (panes/grid) (A4).
- [ ] Dates, state badges, primary CTA at 100% opacity and pass WCAG AA 4.5:1 on the lightest backdrop (A7).
- [ ] Glass over dark backdrop, visible top-left rim, soft shadow, no color mud (§1 tells 1–6).
- [ ] One light direction across the screen.
- [ ] Reduce-Transparency (→ solid 95% surface) and Reduce-Motion (→ instant) fallbacks correct.
- [ ] Loading/empty/error/partial states all designed, not just "ready".
- [ ] RLS verified: a viewer/other-dept organizer cannot read or write what they shouldn't (test, don't assume).

Any unchecked box → not done.

---

## 11. Build order (proposed)

1. Supabase project + schema + RLS + seed organizers + auth.
2. Tokens / Tailwind theme / glass primitives (`<Glass>`, `<GlassNav>`, faux-glass card) + dark canvas.
3. Auth + role gating + app shell (nav, header).
4. Events: list + filter + "happening now" + detail (read path first).
5. Event create/edit + poster upload.
6. Attendance upload + table.
7. Certificates (server PDF gen).
8. Photos gallery.
9. Surveys + responses.
10. Reports (per-event) + annual reports.

---

## 12. Landing page (built) — design decisions

Design intelligence: queried the `ui-ux-pro-max` skill — **Video-First Hero** pattern +
**Modern Dark glassmorphism** + **Playfair Display / Inter** (premium + institutional).

- **Background video** (`public/media/hero.mp4` 854K H.264 + `hero.webm` 64K VP9 + `hero-poster.jpg` 20K),
  generated with ffmpeg: deep-navy field, two slow-drifting ADU-red/navy light blobs, grain, vignette.
  Muted, looped, `playsInline`, `preload="metadata"`, `+faststart`. Content is a sibling on top — never blurred (A1).
- **Reduced Motion / Save-Data → poster still** instead of playback (`VideoBackground.tsx`).
- **Contrast scrim** (dual gradient) over the video so text passes AA on the worst frame — legibility is owned, not accidental (A7).
- **Palette from the ADU logo:** navy `#0a0c16` canvas + ADU red `#f0273a` accent. One vivid accent, dark base, glass.
- **Glass usage:** floating nav + sheets + CTA band use live `backdrop-filter` (`.glass`). All cards use
  `.faux-glass` (tint + rim + shadow, no live blur) — GPU-cheap for long grids AND the Reduce-Transparency fallback.
- **Reveal-on-scroll** is purely additive: content is visible by default, only hides when JS confirms motion is allowed
  (so it can never hide content — the bug the screenshot QA caught and we fixed).

## 13. Routes & structure (built)

```
src/app/(public)/page.tsx        # the landing page  → /
src/app/(public)/layout.tsx      # glass nav shell
src/app/(admin)/admin/page.tsx   # dashboard scaffold → /admin (sidebar, KPIs)
src/app/(admin)/admin/login/     # login (page + LoginForm client) → /admin/login
src/proxy.ts                     # Next 16 middleware → session refresh + /admin gate
src/lib/supabase/{client,server}.ts   # anon-key clients (browser + server)
src/lib/organizers.ts            # the 11 organizers (mirrors the DB seed)
next.config.ts                   # CSP + security headers (HSTS/X-Frame/nosniff/permissions)
supabase/migrations/0001_init.sql # schema + default-deny RLS + private buckets + seed
qa/shoot.mjs + qa/shots/         # Playwright desktop(1440) + mobile(390) capture
```

Next 16 specifics honored: Turbopack default, `middleware`→**`proxy.ts`**, `next/font` self-hosts (no external font CDN → tighter CSP).

## 14. Screenshot QA — current pass

Captured at desktop 1440×900 and mobile 390×844, reduced-motion (also exercises the a11y fallback):
landing · admin-login · admin-dashboard. Result: all surfaces render, text sharp on glass, no mid-word wrapping,
nothing clipped, sidebar collapses to a scroll-nav on mobile, accent CTAs at full opacity. Re-run: `node qa/shoot.mjs`.

> One real bug was caught and fixed by the screenshot, not the code: below-fold content was invisible because the
> scroll-reveal hid it before the observer fired. Proof > code, as required.

---

## 15. Theme change — LIGHT mode (current)

The app is **light mode by default** (was dark). Token system in `globals.css` flipped:
light canvas `#f7f8fb`, dark text `#0c1020`, ADU red `#e11d2e` accent kept. Glass is now light-frosted;
`.faux-glass` cards are solid white. Display font switched from Playfair (serif) to **Space Grotesk** + Inter body.

The **hero is a deliberate dark band** on the light page — it hosts a live WebGL shader (see below).
This is intentional contrast, not a theme leak; it fades into the light canvas.

## 16. Integrated components (`src/components/ui/`)

shadcn convention path; alias `@/*` → `src/*`, so `@/components/ui/*` resolves here.
- `container-scroll-animation.tsx` (framer-motion) — used in the **#showcase** section to reveal the
  admin dashboard in a scroll-driven 3D-tilt card.
- `shader-animation.tsx` (npm `three`) — the **hero background** (CSP-safe, bundled). Wrapped by
  `HeroBackground.tsx` which falls back to a static gradient under Reduce Motion / no-WebGL.
- `shader-lines.tsx` (loads three.js from a **CDN**) — copied in as requested but **NOT wired into the live
  page**: the runtime CDN `<script>` violates our `script-src 'self'` CSP. Use `shader-animation.tsx` instead.
- lucide-react icons on the feature cards.

Deps added: `framer-motion`, `three` (+`@types/three`), `lucide-react`.

## Status

- ✅ Scaffold, env, tokens, glass system, fonts (Space Grotesk + Inter)
- ✅ LIGHT mode theme
- ✅ Public landing page (WebGL shader hero + scroll-reveal showcase + all sections), responsive, screenshot-verified
- ✅ Admin shell (login + dashboard), responsive, screenshot-verified
- ✅ Backend setup: Supabase clients, auth proxy, full schema + RLS + storage + seed migration, security headers
- ⏳ Next: connect a real Supabase project (`.env.local`), run `0001_init.sql`, then build §9 features in §11 order
```
