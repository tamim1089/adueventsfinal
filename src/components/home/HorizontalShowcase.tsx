"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Clock, MapPin, ArrowRight, ArrowUpRight } from "lucide-react";
import { EVENTS_DATA } from "@/lib/events-data";

const EDGE_PX = "pl-[clamp(1.25rem,4vw,5rem)] pr-[clamp(1.25rem,4vw,5rem)]";
const UPCOMING = EVENTS_DATA.upcoming;

function EventPanel({ e }: { e: (typeof UPCOMING)[number] }) {
  const live = e.when.startsWith("Today");
  return (
    <Link
      href={`/events/${e.slug}`}
      className="faux-glass card-hover group flex h-full w-[78vw] shrink-0 flex-col overflow-hidden sm:w-[380px]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image src={e.image} alt="" fill sizes="380px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        {live && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white" style={{ background: "var(--accent)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-medium text-[var(--text-tertiary)]">{e.organizer}</span>
        <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-[var(--text-primary)]">{e.title}</h3>
        <div className="mt-auto flex items-center gap-4 pt-5 font-mono text-[0.6875rem] tabular-nums text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5"><Clock size={13} className="text-[var(--text-tertiary)]" /> {e.when}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-[var(--text-tertiary)]" /> {e.venue}</span>
        </div>
      </div>
    </Link>
  );
}

export default function HorizontalShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [distance, setDistance] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setDistance(Math.max(0, el.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Reduced motion: no horizontal hijack — a calm vertical feed instead.
  if (reduce) {
    return (
      <section className="border-b border-[var(--glass-border)] bg-[var(--bg-base)] py-20 sm:py-28">
        <div className="pl-[clamp(1.25rem,4vw,5rem)] pr-[clamp(1.25rem,4vw,5rem)]">
          <p className="text-sm font-medium text-[var(--text-tertiary)]">
            Fig. 01 — What&apos;s on
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.0] tracking-[-0.02em] text-[var(--text-primary)]">
            Live across every campus.
          </h2>
          <Link
            href="/events"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-[var(--accent-on)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ background: "var(--accent)" }}
          >
            Browse all events <ArrowRight size={17} />
          </Link>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {UPCOMING.map((e) => (
              <EventPanel key={e.slug} e={e} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative bg-[var(--bg-base)]"
      style={{ height: `calc(100vh + ${distance}px)` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden border-b border-[var(--glass-border)]">
        {/* editorial shapes, fixed within the viewport while panels slide */}
        <span className="pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full border border-[var(--glass-border)]" aria-hidden="true" />
        <span className="pointer-events-none absolute right-10 top-16 text-xs font-medium text-[var(--text-tertiary)]" aria-hidden="true">
          Scroll →
        </span>

        <motion.div ref={trackRef} style={{ x }} className={`flex items-stretch gap-6 ${EDGE_PX}`}>
          {/* intro panel */}
          <div className="relative flex w-[86vw] shrink-0 flex-col justify-center sm:w-[44vw]">
            <p className="text-sm font-medium text-[var(--accent)]">
              Fig. 01 — What&apos;s on
            </p>
            <h2 className="mt-4 font-display text-[clamp(2.5rem,7vw,6rem)] font-bold leading-[0.95] tracking-[-0.03em] text-[var(--text-primary)]">
              Live across
              <br />
              every campus.
            </h2>
            <p className="mt-6 max-w-sm text-lg leading-relaxed text-[var(--text-secondary)]">
              Keep scrolling — the day&apos;s events slide through, the moment
              they go live.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent)" }} />
              <span className="h-px w-24 bg-[var(--glass-border)]" />
              <span className="text-xs font-medium text-[var(--text-tertiary)]">
                {String(UPCOMING.length).padStart(2, "0")} events
              </span>
            </div>
            <Link
              href="/events"
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-[var(--accent-on)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ background: "var(--accent)" }}
            >
              Browse all events <ArrowRight size={17} />
            </Link>
          </div>

          {/* event panels */}
          {UPCOMING.map((e) => (
            <div key={e.slug} className="flex items-center">
              <EventPanel e={e} />
            </div>
          ))}

          {/* closing CTA panel */}
          <div className="flex w-[78vw] shrink-0 items-center sm:w-[360px]">
            <Link
              href="/events"
              className="group relative flex h-[60%] w-full flex-col justify-center gap-4 overflow-hidden border border-[var(--glass-border)] p-8 transition-colors hover:border-[var(--accent)]"
              style={{ borderRadius: "var(--r-xl)" }}
            >
              <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border border-[var(--glass-border)]" aria-hidden="true" />
              <ArrowUpRight size={28} className="text-[var(--accent)] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              <span className="font-display text-3xl font-semibold leading-tight text-[var(--text-primary)]">
                See every<br />event
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
                Browse all <ArrowRight size={13} />
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
