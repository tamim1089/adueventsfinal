"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useMotionValue, useMotionValueEvent, animate, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { GetStartedButton } from "@/components/ui/get-started-button";

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";
const EASE = [0.2, 0.8, 0.2, 1] as const;

export type LiveEvent = {
  slug: string;
  title: string;
  organizer: string;
  when: string;
  venue: string;
  image: string;
  bannerUrl?: string | null;
};

const STATS = [
  { value: "11", label: "Organizers" },
  { value: "5", label: "Colleges" },
  { value: "24", label: "Events this term", suffix: "+" },
];

const lineReveal: Variants = {
  hidden: { y: "110%" },
  show: (i: number) => ({ y: "0%", transition: { duration: 0.7, ease: EASE, delay: 0.2 + i * 0.09 } }),
};

/* ---------- Slide 1: the hero ---------- */
function HeroPanel({ reduce }: { reduce: boolean | null }) {
  return (
    <section className="relative flex h-[100svh] w-full flex-col overflow-hidden">
      <Image src="/media/unifront.jpg" alt="Abu Dhabi University campus" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(16,12,10,0.62) 0%, rgba(16,12,10,0.30) 42%, rgba(16,12,10,0.85) 100%)" }} />

      <div className={`relative z-10 flex h-full flex-col ${EDGE}`}>
        <motion.div className="pt-24 sm:pt-28" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
          <Image src="/brand/adu-mark.png" alt="Abu Dhabi University" width={699} height={699} priority className="h-16 w-auto object-contain drop-shadow-lg sm:h-20 lg:h-24" />
        </motion.div>

        <div className="mt-auto pb-8">
          <h1 className="max-w-4xl font-display font-bold leading-[0.95] tracking-[-0.03em] text-white text-[clamp(2.25rem,6.5vw,6rem)]" style={{ textShadow: "0 2px 24px rgba(16,12,10,0.4)" }}>
            <span className="block overflow-hidden"><motion.span className="block" custom={0} variants={lineReveal} initial={reduce ? "show" : "hidden"} animate="show">ADU Al Ain Campus Gateway</motion.span></span>
          </h1>
          <motion.p
            className="mt-4 max-w-2xl font-sans text-[clamp(1.05rem,2.4vw,1.9rem)] font-semibold leading-snug tracking-tight"
            style={{ color: "#ff3346", textShadow: "0 1px 2px rgba(16,12,10,0.55), 0 2px 16px rgba(16,12,10,0.6)" }}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
          >
            Events. Partnerships. Empowered Learning. Community Impact.
          </motion.p>
          <motion.div initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <GetStartedButton href="/events" label="Explore events" />
              <GetStartedButton href="/admin" label="Organizer sign in" variant="ghost" />
            </div>
          </motion.div>

          <div className="mt-9 border-t border-white/15 pt-5">
            <dl className="flex flex-wrap items-end gap-x-14 gap-y-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dd className="font-display text-4xl font-bold tabular-nums text-white">{s.value}{s.suffix && <span className="text-[var(--accent)]">{s.suffix}</span>}</dd>
                  <dt className="mt-1 text-sm font-medium text-white/60">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {!reduce && (
        <div className="absolute bottom-6 right-[clamp(1.25rem,4vw,5rem)] z-10 hidden items-center gap-2 text-sm font-medium text-white/70 sm:flex">
          Scroll <ArrowRight size={16} />
        </div>
      )}
    </section>
  );
}

/* ---------- Slide 2: live events ---------- */
function LivePanel({ events }: { events: LiveEvent[] }) {
  return (
    <section className="relative flex h-[100svh] w-full flex-col justify-center overflow-hidden bg-[var(--bg-base)]">
      {/* subtle decorative dots — desktop only */}
      <span className="pointer-events-none absolute -left-24 top-1/4 hidden h-80 w-80 rounded-full border border-[var(--glass-border)] lg:block" aria-hidden="true" />
      <span className="pointer-events-none absolute right-16 top-24 hidden h-2.5 w-2.5 rounded-full lg:block" style={{ background: "var(--accent)" }} aria-hidden="true" />

      {/* heading — uses edge padding so text aligns with nav */}
      <div className={`relative ${EDGE}`}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] sm:text-sm">Fig. 01 — What&apos;s on</p>
        <h2 className="mt-2 font-display text-[clamp(1.85rem,5vw,5rem)] font-bold leading-[0.96] tracking-[-0.03em] text-[var(--text-primary)] sm:mt-3">
          Live across<br className="sm:hidden" /> every campus.
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)] sm:mt-4 sm:text-lg">
          The day&apos;s events, the moment they go live — across every college, department, and center.
        </p>
      </div>

      {/* ── MOBILE: horizontal snap-scroll strip ── */}
      <div className="mt-5 sm:hidden">
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
          style={{ paddingLeft: "clamp(1.25rem,4vw,5rem)", paddingRight: "clamp(1.25rem,4vw,5rem)", scrollbarWidth: "none" }}
        >
          {events.slice(0, 3).map((e) => {
            const live = e.when.startsWith("Today");
            const imgSrc = e.bannerUrl ?? e.image;
            return (
              <Link
                key={e.slug}
                href={`/events/${e.slug}`}
                className="faux-glass card-hover group flex w-[76vw] shrink-0 snap-start flex-col overflow-hidden"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image src={imgSrc} alt="" fill sizes="76vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  {live && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white" style={{ background: "var(--accent)" }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{e.organizer}</span>
                  <h3 className="mt-1.5 font-display text-base font-semibold leading-tight text-[var(--text-primary)]">{e.title}</h3>
                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-3 text-[11px] text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1"><Clock size={11} className="text-[var(--text-tertiary)]" /> {e.when}</span>
                    <span className="inline-flex items-center gap-1"><MapPin size={11} className="text-[var(--text-tertiary)]" /> {e.venue}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {/* scroll hint dots */}
        <div className="mt-3 flex items-center justify-center gap-1.5 px-[clamp(1.25rem,4vw,5rem)]">
          {events.slice(0, 3).map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === 0 ? "w-4 bg-[var(--accent)]" : "w-1.5 bg-[var(--glass-border)]"}`} />
          ))}
        </div>
      </div>

      {/* ── DESKTOP: 3-column grid ── */}
      <div className={`mt-9 hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3 ${EDGE}`}>
          {events.slice(0, 3).map((e) => {
            const live = e.when.startsWith("Today");
            const imgSrc = e.bannerUrl ?? e.image;
            return (
              <Link key={e.slug} href={`/events/${e.slug}`} className="faux-glass card-hover group flex flex-col overflow-hidden">
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image src={imgSrc} alt="" fill sizes="360px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  {live && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white" style={{ background: "var(--accent)" }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs font-medium text-[var(--text-tertiary)]">{e.organizer}</span>
                  <h3 className="mt-2 font-display text-xl font-semibold leading-tight text-[var(--text-primary)]">{e.title}</h3>
                  <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1.5"><Clock size={13} className="text-[var(--text-tertiary)]" /> {e.when}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-[var(--text-tertiary)]" /> {e.venue}</span>
                  </div>
                </div>
              </Link>
            );
          })}
      </div>

      <div className={`mt-6 sm:mt-8 ${EDGE}`}>
        <Link href="/events" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[var(--accent-on)] transition-transform hover:-translate-y-0.5 active:scale-[0.98] sm:px-7 sm:py-3.5 sm:text-base" style={{ background: "var(--accent)" }}>
          Browse all events <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}

export default function HeroSlides({ events }: { events: LiveEvent[] }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Self-paced slide: a little scroll past the threshold triggers a calm,
  // fixed-duration glide to the next panel — independent of how fast you scroll.
  const x = useMotionValue("0%");
  const slide = useRef(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const target = p >= 0.28 ? 1 : 0;
    if (target !== slide.current) {
      slide.current = target;
      animate(x, target === 1 ? "-50%" : "0%", { duration: 1, ease: [0.22, 0.61, 0.36, 1] });
    }
  });

  // Reduced motion / no hijack: stack the two panels vertically.
  if (reduce) {
    return (
      <>
        <HeroPanel reduce />
        <LivePanel events={events} />
      </>
    );
  }

  return (
    <section ref={ref} className="relative" style={{ height: "200vh" }}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <motion.div style={{ x }} className="flex h-full w-[200vw]">
          <div className="h-full w-screen shrink-0"><HeroPanel reduce={false} /></div>
          <div className="h-full w-screen shrink-0"><LivePanel events={events} /></div>
        </motion.div>
      </div>
    </section>
  );
}
