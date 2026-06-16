"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Clock,
  MapPin,
  Users,
  ArrowUpRight,
  ArrowRight,
  CalendarRange,
  ImageUp,
  BadgeCheck,
  MessageSquareText,
  Images,
  FileBarChart,
} from "lucide-react";
import { EVENTS_DATA } from "@/lib/events-data";
import { ORGANIZERS } from "@/lib/organizers";

/* ----------------------------------------------------------------
   Layout primitive: bands set their own width.
   EDGE = fluid gutters that scale with the viewport and fill the
   canvas — NOT a fixed centered max-w box with dead margins.
   ---------------------------------------------------------------- */
const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

const UPCOMING = EVENTS_DATA.upcoming;
const FEATURED = UPCOMING[0];
const LIVE = UPCOMING.filter((e) => e.when.startsWith("Today"));

const FEATURES = [
  { icon: CalendarRange, title: "Browse by organizer", body: "Jump straight to any college, department, or center. Eleven organizers, one map." },
  { icon: ImageUp, title: "Posters, dates & venues", body: "Every event carries its poster, schedule, and location — clear at a glance." },
  { icon: BadgeCheck, title: "Attendance & certificates", body: "Upload attendance, then auto-generate and share certificates in a click." },
  { icon: MessageSquareText, title: "Post-event surveys", body: "Collect participant feedback with a survey attached to the event." },
  { icon: Images, title: "Photo galleries", body: "Document the day. Highlight student life with post-event photos." },
  { icon: FileBarChart, title: "Reports & reviews", body: "Download per-event reports and publish each department's annual report." },
];

const STATS = [
  { value: "11", label: "Organizers" },
  { value: "5", label: "Colleges" },
  { value: "24", label: "Events this term", suffix: "+" },
];

/* ---- motion primitives ---------------------------------------- */
const EASE = [0.2, 0.8, 0.2, 1] as const;

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const lineReveal: Variants = {
  hidden: { y: "110%" },
  show: (i: number) => ({
    y: "0%",
    transition: { duration: 0.7, ease: EASE, delay: 0.15 + i * 0.08 },
  }),
};

export default function LandingPage() {
  const reduce = useReducedMotion();

  return (
    <>
      {/* ============================================================
          BAND 1 — HERO (full-bleed). Video fills the viewport edge to
          edge. Headline is left-weighted; the right column carries a
          LIVE rail so the margin works; stats run full-width at the base.
          ============================================================ */}
      <section className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden">
        {/* background video + warm dark wash */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/media/hero-poster.jpg"
        >
          <source src="/media/hero.webm" type="video/webm" />
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(16,12,10,0.55) 0%, rgba(16,12,10,0.25) 38%, rgba(16,12,10,0.78) 100%)",
          }}
        />

        {/* content fills the canvas — no centered max-w box */}
        <div className={`relative z-10 grid grid-cols-1 items-end gap-10 pb-10 pt-28 lg:grid-cols-12 ${EDGE}`}>
          {/* headline */}
          <div className="lg:col-span-8">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-white/65">
              Abu Dhabi University · live across every campus
            </p>

            <h1 className="mt-5 font-display font-bold leading-[0.95] tracking-[-0.03em] text-white text-[clamp(2.75rem,8vw,7rem)]">
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  custom={0}
                  variants={lineReveal}
                  initial={reduce ? "show" : "hidden"}
                  animate="show"
                >
                  Every ADU event,
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  style={{ color: "var(--accent)" }}
                  custom={1}
                  variants={lineReveal}
                  initial={reduce ? "show" : "hidden"}
                  animate="show"
                >
                  in one place.
                </motion.span>
              </span>
            </h1>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
            >
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
                What&apos;s on across ADU — every college, department, and
                center, the moment it goes live.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#live"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.98]"
                  style={{ background: "var(--accent)" }}
                >
                  Explore events <ArrowRight size={17} />
                </a>
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Organizer sign in
                </Link>
              </div>
            </motion.div>
          </div>

          {/* LIVE rail — fills the right margin instead of leaving it dead */}
          <motion.aside
            className="lg:col-span-4 lg:pb-2"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}
          >
            <div className="flex items-center gap-2 border-b border-white/15 pb-3">
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${reduce ? "" : "animate-ping"}`}
                  style={{ background: "var(--accent)" }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
              </span>
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-white/70">
                Live now
              </span>
            </div>
            <ul className="divide-y divide-white/10">
              {LIVE.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/events/${e.slug}`}
                    className="group flex items-baseline justify-between gap-4 py-3.5"
                  >
                    <span>
                      <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-white/55">
                        {e.organizer}
                      </span>
                      <span className="mt-1 block font-display text-lg leading-tight text-white transition-colors group-hover:text-[var(--accent)]">
                        {e.title}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-white/65">
                      {e.when.replace("Today · ", "")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.aside>
        </div>

        {/* stats — full-width band along the hero base */}
        <div className={`relative z-10 border-t border-white/15 py-6 ${EDGE}`}>
          <dl className="flex flex-wrap items-end gap-x-14 gap-y-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <dd className="font-display text-4xl font-bold tabular-nums text-white">
                  {s.value}
                  {s.suffix && <span className="text-[var(--accent)]">{s.suffix}</span>}
                </dd>
                <dt className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-white/55">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============================================================
          BAND 2 — LIVE STRIP (full-bleed ticker). The row runs past the
          right edge and scrolls, so live sessions read as a feed, not
          three lonely cards in a centered box.
          ============================================================ */}
      <section id="live" className="border-b border-[var(--glass-border)] bg-[var(--bg-base)] py-20 sm:py-28">
        <FadeUp className={EDGE}>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
            Happening now
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)]">
            Live events, the moment they go live.
          </h2>
        </FadeUp>

        <div className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pl-[clamp(1.25rem,4vw,5rem)] pr-[clamp(1.25rem,4vw,5rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {UPCOMING.map((e, i) => {
            const live = e.when.startsWith("Today");
            return (
              <FadeUp
                key={e.slug}
                delay={i * 0.06}
                className="w-[clamp(280px,80vw,380px)] shrink-0 snap-start"
              >
                <Link
                  href={`/events/${e.slug}`}
                  className="faux-glass card-hover group flex h-full flex-col overflow-hidden"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <Image
                      src={e.image}
                      alt=""
                      fill
                      sizes="380px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {live && (
                      <span
                        className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                        style={{ background: "var(--accent)" }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      {e.organizer}
                    </span>
                    <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-[var(--text-primary)]">
                      {e.title}
                    </h3>
                    <div className="mt-auto flex items-center gap-4 pt-5 font-mono text-[0.6875rem] tabular-nums text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} className="text-[var(--text-tertiary)]" />
                        {e.when}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} className="text-[var(--text-tertiary)]" />
                        {e.venue}
                      </span>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            );
          })}

          {/* trailing "all events" affordance, inline with the feed */}
          <FadeUp delay={UPCOMING.length * 0.06} className="flex w-[260px] shrink-0 snap-start items-center">
            <Link
              href="/events"
              className="group flex h-full w-full flex-col justify-center gap-3 border border-dashed border-[var(--glass-border)] px-6 text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{ borderRadius: "var(--r-xl)" }}
            >
              <ArrowUpRight size={24} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              <span className="font-display text-xl font-semibold leading-tight">
                See all events
              </span>
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ============================================================
          BAND 3 — FEATURED (full-bleed split). One flagship event,
          image edge-to-edge on one side, editorial copy on the other.
          ============================================================ */}
      <section className="grid grid-cols-1 border-b border-[var(--glass-border)] lg:grid-cols-2">
        <div className="relative min-h-[320px] lg:min-h-[560px]">
          <Image
            src={FEATURED.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <FadeUp className="flex flex-col justify-center px-[clamp(1.25rem,4vw,5rem)] py-16 lg:py-20">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-[var(--accent)]">
            Featured · {FEATURED.organizer}
          </p>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.04] tracking-[-0.02em] text-[var(--text-primary)]">
            {FEATURED.title}
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--text-secondary)]">
            {FEATURED.overview}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-[var(--glass-border)] pt-6 font-mono text-[0.75rem] tabular-nums text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-2">
              <Clock size={14} className="text-[var(--text-tertiary)]" /> {FEATURED.when}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin size={14} className="text-[var(--text-tertiary)]" /> {FEATURED.venue}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users size={14} className="text-[var(--text-tertiary)]" /> {FEATURED.attending} attending
            </span>
          </div>
          <Link
            href={`/events/${FEATURED.slug}`}
            className="mt-8 inline-flex w-fit items-center gap-2 font-semibold text-[var(--accent)] transition-transform hover:translate-x-0.5"
          >
            View full details <ArrowRight size={17} />
          </Link>
        </FadeUp>
      </section>

      {/* ============================================================
          BAND 4 — ORGANIZERS INDEX. Reading width is constrained, but
          the left margin WORKS: it holds the section number + sticky
          heading. Organizers are a dense editorial index, not pillows.
          ============================================================ */}
      <section id="organizers" className="border-b border-[var(--glass-border)] bg-[var(--bg-subtle)]">
        <div className={`grid grid-cols-1 gap-12 py-20 sm:py-28 lg:grid-cols-12 ${EDGE}`}>
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                01 — Organizers
              </p>
              <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.04] tracking-[-0.02em] text-[var(--text-primary)]">
                Eleven ways in.
              </h2>
              <p className="mt-4 max-w-xs text-[var(--text-secondary)]">
                Every college, department, and center publishes here. Pick a
                source and follow only what matters to you.
              </p>
            </div>
          </div>

          <ul className="lg:col-span-8">
            {ORGANIZERS.map((o, i) => (
              <li key={o.slug}>
                <a
                  href="/events"
                  className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-t border-[var(--glass-border)] py-5 last:border-b"
                >
                  <span className="font-mono text-[0.75rem] tabular-nums text-[var(--text-tertiary)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-xl font-medium leading-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)] sm:text-2xl">
                    {o.name}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="hidden font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-tertiary)] sm:inline">
                      {o.kind}
                    </span>
                    <ArrowUpRight
                      size={18}
                      className="-translate-x-1 text-[var(--text-tertiary)] opacity-0 transition-all group-hover:translate-x-0 group-hover:text-[var(--accent)] group-hover:opacity-100"
                    />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================================================
          BAND 5 — FEATURES. Full-canvas bordered grid (cells share
          hairlines, like a table) — not three floating pillow cards.
          ============================================================ */}
      <section id="features" className="bg-[var(--bg-base)]">
        <FadeUp className={`pt-20 sm:pt-28 ${EDGE}`}>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
            02 — For organizers
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.04] tracking-[-0.02em] text-[var(--text-primary)]">
            From the poster to the report — handled.
          </h2>
        </FadeUp>

        <div className="mt-12 grid grid-cols-1 gap-px border-y border-[var(--glass-border)] bg-[var(--glass-border)] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeUp
                key={f.title}
                delay={(i % 3) * 0.06}
                className="flex h-full flex-col bg-[var(--bg-base)] px-[clamp(1.25rem,4vw,5rem)] py-10 sm:px-8 lg:px-9"
              >
                <span className="font-mono text-[0.6875rem] tabular-nums text-[var(--text-tertiary)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon size={22} strokeWidth={1.75} className="mt-5 text-[var(--accent)]" aria-hidden="true" />
                <h3 className="mt-4 font-display text-xl font-semibold text-[var(--text-primary)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
                  {f.body}
                </p>
              </FadeUp>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          BAND 6 — CAMPUS (full-bleed photo with overlaid label).
          ============================================================ */}
      <section className="relative h-[clamp(360px,55vh,640px)] w-full overflow-hidden border-b border-[var(--glass-border)]">
        <Image
          src="/media/unifront.jpg"
          alt="Abu Dhabi University campus"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(16,12,10,0.15) 0%, rgba(16,12,10,0.65) 100%)" }}
        />
        <div className={`absolute inset-x-0 bottom-0 pb-12 ${EDGE}`}>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-white/65">
            Life at ADU
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.75rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em] text-white">
            One campus, always in motion.
          </h2>
        </div>
      </section>

      {/* ============================================================
          BAND 7 — CTA (full-bleed red band, not a centered card).
          ============================================================ */}
      <section
        className={`py-24 sm:py-32 ${EDGE}`}
        style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)" }}
      >
        <FadeUp className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="max-w-xl font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.04] tracking-[-0.02em] text-white">
              Run your next event here.
            </h2>
            <p className="mt-4 max-w-md text-white/85">
              Organizers across ADU publish, track, and document events in one
              workspace.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[var(--accent-strong)] transition-transform active:scale-[0.98]"
          >
            Sign in to get started <ArrowRight size={17} />
          </Link>
        </FadeUp>
      </section>
    </>
  );
}
