# ADU EVENTS — MASTER REDESIGN COMMAND

**A single executable spec for transforming the whole site.** An agent (or you)
should be able to follow it page by page and produce a site that a working
designer could not flag as AI-generated in ten seconds.

Stack is fixed: **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Framer Motion · Supabase.** Do not migrate frameworks.

The **home page is the canonical reference** (§7). Every other surface must match
its conventions. When this file and any older instruction disagree, this file wins.

> Implementation status: §1–§10 have been executed. The home page, public shell
> (`SiteNav` + `Footer`), `/events`, `/events/[slug]`, `/admin`, `/admin/login`,
> `/partnerships`, the 404, and the loader all follow the laws below; the costume
> components and the `three` dependency have been removed.

---

## 1 — North Star (what actually wins)

- **One signature moment.** ADU's is the **live hero + live rail/ticker** and the
  **editorial type**. Everything else stays quiet so that lands.
- **Performance under pressure.** 60fps on a mid-range phone. This is why the
  cosmic shaders / Three.js atmosphere were removed.
- **Real content.** Genuine photography (`/public/media/photos`), original copy.
  No stock filler, no lorem.
- **Fill the canvas with intent.** No 1200px column stranded in a 1920px viewport
  with dead grey margins. Every band sizes itself.

If a change doesn't serve one of these four, cut it.

---

## 2 — The Design Law (non-negotiable)

### 2.1 Layout law
- **No single centered column governs a page.** Delete `mx-auto max-w-6xl/7xl`.
- A page is a vertical stack of **bands**; each picks ONE width:
  1. **Full-bleed** — hero, photography, live strip, CTA, campus band.
  2. **Constrained-with-working-margin** — body capped near 65ch; the leftover
     margin holds a sticky section number/heading/index (never grey).
  3. **Rail + content (app shell)** — fixed sidebar + fluid content using all
     remaining width. The law for `/events` and `/admin`.
- Horizontal breathing room is a **fluid gutter**: `px-[clamp(1.25rem,4vw,5rem)]`.
- Alternate full-bleed and constrained bands for rhythm.

### 2.2 Type law
- **Display:** Fraunces (variable serif). **Body/UI:** Hanken Grotesk.
  **Data / eyebrows / metadata:** JetBrains Mono.
- Banned: Inter/Roboto/system-ui as a primary face; >~6 type sizes; untracked
  large headlines.
- Headlines tracked tight (`-0.02em`…`-0.03em`), leading `1.0–1.1`. Body leading
  `1.5–1.6`. `tabular-nums` on every number; mono for IDs, times, counts.

### 2.3 Color law
- **Two hues total:** the warm-neutral ramp + **one ADU red**.
- Red is **jewelry** — **< 5% of pixels** above the fold (primary button, live
  dot, active link, one accent moment). Not on every border.
- Warm paper (`#faf8f4`) over pure white; warm charcoal ink. Borders/dividers at
  6–12% alpha (hairlines).

### 2.4 Motion law
- One vocabulary as CSS vars (durations + eases). Never the browser default.
- **Animate only `transform` and `opacity`.** Entering → ease-out; leaving → ease-in.
- One orchestrated signature (the hero line reveal) beats micro-interactions
  everywhere. Stagger list reveals 40–80ms.
- Hover = a hint (1–2px lift, border brighten), never `scale(1.03)` + shadow bloom.
- Skeletons, not spinners. Respect `prefers-reduced-motion`. Page-load motion < 1s.

### 2.5 Surface law (marks a page as AI in 0.5s — never produce)
Glassmorphism over gradients; mesh/grain/cosmic/starfield/shader/neural-vortex
backgrounds; drifting blobs; per-card mouse spotlights; `//`/`—`-prefixed
decorative labels; ultralight giant section-number markers; "SCROLL ↓" cues;
sliding-pill toggles; uniform 12px radius + one stock `0 4px 6px` shadow on every
card; unmodified Tailwind indigo/violet/purple as accent.

### 2.6 Quality floor
WCAG AA contrast; visible `:focus-visible` rings; full keyboard operability; real
labels; responsive (restructure, don't shrink); designed empty/error/loading
states; watch LCP/CLS.

---

## 3 — The costume (deleted)

Removed once grep confirmed they were unused by the redesign:
`landing/HeroBackground`, `landing/ShowcaseScreen`, `landing/YouTubeEmbed`,
`landing/Reveal`, `ui/container-scroll-animation`, `ui/prisma-hero`,
`ui/flow-button`, `glass/GlassNav`, `ui/hotel-card`, `ui/travel-card`,
`ui/space-background`, `ui/shader-animation`, `ui/shader-lines`,
`ui/interactive-neural-vortex-background`, `ui/parallax-cosmic-background`,
`ui/animated-theme-toggler`, `ui/liquid-radio`, `ui/radio-group`.
Cosmic/blob/reveal CSS stripped from `globals.css`. Dropped `three`,
`@types/three`, `@radix-ui/react-radio-group`.

---

## 4 — Pattern library (vetted, not parroted)

- **F/Z scanning patterns** are diagnostics, not blueprints. Interrupt the F with
  hierarchy; use Z only on sparse, image-led hero pages.
- **Grid:** fluid `repeat(auto-fill, minmax(320px, 1fr))` that fills width.
  Bento/varied only when cells differ in shape.
- **Hierarchy/typography:** one or two families, severe contrast.
- **Sticky nav:** full-width with a hairline rule (not a glass pill); ≤12% of
  mobile height.
- **Fat footer:** structured, editorial, hairline-separated — not a link dump.
- **Cards:** editorial (image + mono organizer eyebrow + serif title + mono meta),
  hairline-led; dense lists prefer hairline rows / bordered grids over floating
  pillows.
- **Modular components** in this stack = RSC + colocation.
- **MVC / Front Controller** do NOT apply to App Router; see §5.

---

## 5 — Architecture (Next App Router)

- Server Components by default; push `"use client"` to interactive leaves.
  (The home marks the whole page client for animation simplicity; heavier app
  pages keep `page.tsx` server and isolate motion into client leaves — e.g.
  `EventDetail.tsx`.)
- Colocate route components + data access; `loading.tsx` for skeletons.
- Feature folders over a `/utils` junk drawer.
- Server Actions for mutations; API routes only for external clients.
- Don't over-abstract.

---

## 6 — Tokens

Kept token file (warm paper, rationed red, hairline cards, committed radii,
reduced-motion/transparency handling, focus rings). Body font swapped Inter →
Hanken Grotesk (`--font-body`). Added a motion vocabulary to `:root`:

```css
--dur-fast: 150ms; --dur-base: 250ms; --dur-slow: 500ms;
--ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
--ease-in:  cubic-bezier(0.6, 0, 0.4, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 7 — Canonical reference: the home page

`src/app/(public)/page.tsx` is the standard. Match its layout discipline (the
`EDGE = "px-[clamp(1.25rem,4vw,5rem)]"` gutter), type usage, `FadeUp` +
line-reveal motion, Fraunces/Hanken/JetBrains, hairlines, and rationed red on
every other page. Nav lives in `src/components/SiteNav.tsx`; the shared footer in
`src/components/Footer.tsx`, both wired through `src/app/(public)/layout.tsx`.

---

## 8 — Per-page orders (executed)

- **8.1 `/events`** — rail + content app shell. Sticky hairline filter rail
  (All / Live / per-organizer), featured split, `auto-fill minmax(300px,1fr)`
  grid filling all width. Text tabs + sliding underline (no pill). `loading.tsx`
  skeleton matching the grid. Designed empty state.
- **8.2 `/events/[slug]`** — full-bleed image hero with serif title rise; reading
  column (65ch) beside a sticky mono+tabular facts rail; "More from {organizer}"
  full-bleed related strip. Server page (SSG/metadata) + animated client leaf;
  unknown slug → `notFound()`.
- **8.3 `/admin`** — rail + content; real mono tabular KPIs (no `—`); no glows;
  hairline-led grids; sidebar active = hairline left-rule; activity is a designed
  empty state, not a fake chart.
- **8.4 `/admin/login`** — calm warm-paper card (auth earns a small constrained
  box); cosmic background removed; taller inputs; visible labels; loading state.
- **8.5 `/partnerships`** — intro band + per-group bands with a hairline-divided
  partner index and a full-bleed CTA. No `max-w-7xl`.
- **8.6 `not-found`** — editorial full-bleed warm canvas, big serif + mono, one CTA.
- **8.7 Loading** — minimal ADU mark + hairline bar on warm paper, < 1s. Cosmic
  loader removed.
- **8.8 Footer** — structured editorial footer (wordmark + browse + organizers
  index + institutional line), hairline-led, shared via the public layout.

---

## 9 — Acceptance criteria

1. No dead grey margin at 1920px; every band chose a width; no lone `mx-auto max-w-*`.
2. Exactly one memorable moment; the rest quiet.
3. Fraunces / Hanken / JetBrains only; ≤6 sizes; tracked headlines; `tabular-nums`.
4. Red < 5% of pixels; hairlines at low alpha; warm paper.
5. Zero glassmorphism-over-gradient, mesh/grain/cosmic/shaders, per-card spotlights,
   `//` labels, uniform-12px-everywhere.
6. `transform`/`opacity` only; one signature; reduced-motion honored; skeletons; <1s.
7. Every interactive element has default/hover/focus/active/disabled/loading; empty
   + error states designed.
8. AA contrast; visible focus; keyboard order; LCP/CLS clean on a mid-range phone.
9. `"use client"` pushed toward leaves on app pages; data colocated; mutations via
   Server Actions.
10. The 10-second test: could a competent designer tell an AI made this in 10s?

---

## 10 — Execution order (done)

1. Tokens + fonts (§6). 2. Nav + Footer (§7, §8.8). 3. Home (§7). 4. Loading (§8.7).
5. `/events` (§8.1). 6. `/events/[slug]` (§8.2). 7. `/admin` (§8.3) + login (§8.4).
8. `/partnerships` (§8.5) + 404 (§8.6). 9. Costume + dep cleanup (§3).
10. Final pass against §9.

*The home page in §7 is the reference; everything else matches it. When in doubt,
strip away — the hardest premium move is deletion.*
