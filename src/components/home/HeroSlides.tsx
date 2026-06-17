"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useMotionValue, useMotionValueEvent, animate, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { EVENTS_DATA } from "@/lib/events-data";
import { GetStartedButton } from "@/components/ui/get-started-button";

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";
const EASE = [0.2, 0.8, 0.2, 1] as const;
const UPCOMING = EVENTS_DATA.upcoming;
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
          <Image src="/brand/adu-logo-transparent.png" alt="Abu Dhabi University" width={2500} height={1878} priority className="h-24 w-auto object-contain object-left sm:h-36 lg:h-44" />
        </motion.div>

        <div className="mt-auto pb-8">
          <h1 className="font-display font-bold leading-[0.92] tracking-[-0.035em] text-white text-[clamp(3rem,9vw,8rem)]">
            <span className="block overflow-hidden"><motion.span className="block" custom={0} variants={lineReveal} initial={reduce ? "show" : "hidden"} animate="show">Every ADU event,</motion.span></span>
            <span className="block overflow-hidden"><motion.span className="block" style={{ color: "var(--accent)" }} custom={1} variants={lineReveal} initial={reduce ? "show" : "hidden"} animate="show">in one place.</motion.span></span>
          </h1>
          <motion.div initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">What&apos;s on across ADU — every college, department, and center, the moment it goes live.</p>
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

/* ---------- Slide 2: live events (was a separate section) ---------- */
function LivePanel() {
  return (
    <section className={`relative flex h-[100svh] w-full flex-col justify-center overflow-hidden bg-[var(--bg-base)] ${EDGE}`}>
      <span className="pointer-events-none absolute -left-24 top-1/4 hidden h-80 w-80 rounded-full border border-[var(--glass-border)] lg:block" aria-hidden="true" />
      <span className="pointer-events-none absolute right-16 top-24 hidden h-2.5 w-2.5 rounded-full lg:block" style={{ background: "var(--accent)" }} aria-hidden="true" />

      <div className="relative">
        <p className="text-sm font-medium text-[var(--accent)]">Fig. 01 — What&apos;s on</p>
        <h2 className="mt-3 max-w-3xl font-display text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[0.98] tracking-[-0.03em] text-[var(--text-primary)]">Live across every campus.</h2>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-[var(--text-secondary)]">The day&apos;s events, the moment they go live — across every college, department, and center.</p>

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {UPCOMING.slice(0, 3).map((e) => {
            const live = e.when.startsWith("Today");
            return (
              <Link key={e.slug} href={`/events/${e.slug}`} className="faux-glass card-hover group flex flex-col overflow-hidden">
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image src={e.image} alt="" fill sizes="360px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  {live && <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white" style={{ background: "var(--accent)" }}><span className="h-1.5 w-1.5 rounded-full bg-white" /> Live</span>}
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

        <Link href="/events" className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-[var(--accent-on)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]" style={{ background: "var(--accent)" }}>
          Browse all events <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}

export default function HeroSlides() {
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
        <LivePanel />
      </>
    );
  }

  return (
    <section ref={ref} className="relative" style={{ height: "200vh" }}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <motion.div style={{ x }} className="flex h-full w-[200vw]">
          <div className="h-full w-screen shrink-0"><HeroPanel reduce={false} /></div>
          <div className="h-full w-screen shrink-0"><LivePanel /></div>
        </motion.div>
      </div>
    </section>
  );
}
