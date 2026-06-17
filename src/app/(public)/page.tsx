"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  CalendarRange,
  ImageUp,
  BadgeCheck,
  MessageSquareText,
  Images,
  FileBarChart,
} from "lucide-react";
import { ORGANIZERS } from "@/lib/organizers";
import HeroSlides from "@/components/home/HeroSlides";
import TabletShowcase from "@/components/home/TabletShowcase";

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

const FEATURES = [
  { icon: CalendarRange, title: "Browse by organizer", body: "Jump straight to any college, department, or center. Eleven organizers, one map." },
  { icon: ImageUp, title: "Posters, dates & venues", body: "Every event carries its poster, schedule, and location — clear at a glance." },
  { icon: BadgeCheck, title: "Attendance & certificates", body: "Upload attendance, then auto-generate and share certificates in a click." },
  { icon: MessageSquareText, title: "Post-event surveys", body: "Collect participant feedback with a survey attached to the event." },
  { icon: Images, title: "Photo galleries", body: "Document the day. Highlight student life with post-event photos." },
  { icon: FileBarChart, title: "Reports & reviews", body: "Download per-event reports and publish each department's annual report." },
];

const EASE = [0.2, 0.8, 0.2, 1] as const;

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
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

export default function LandingPage() {
  return (
    <>
      {/* BAND 1+2 — pinned horizontal: hero slides left into the live-events slide */}
      <HeroSlides />

      {/* BAND 3 — tablet showcase */}
      <TabletShowcase />

      {/* BAND 4 — organizers index */}
      <section id="organizers" className="border-b border-[var(--glass-border)] bg-[var(--bg-subtle)]">
        <div className={`grid grid-cols-1 gap-12 py-20 sm:py-28 lg:grid-cols-12 ${EDGE}`}>
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-medium text-[var(--text-tertiary)]">02 — Organizers</p>
              <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.04] tracking-[-0.02em] text-[var(--text-primary)]">Eleven ways in.</h2>
              <p className="mt-4 max-w-xs text-[var(--text-secondary)]">Every college, department, and center publishes here. Pick a source and follow only what matters to you.</p>
            </div>
          </div>
          <ul className="lg:col-span-8">
            {ORGANIZERS.map((o, i) => (
              <li key={o.slug}>
                <Link href="/events" className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-t border-[var(--glass-border)] py-5 last:border-b">
                  <span className="font-mono text-sm tabular-nums text-[var(--text-tertiary)]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-xl font-medium leading-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)] sm:text-2xl">{o.name}</span>
                  <span className="flex items-center gap-3">
                    <span className="hidden text-xs font-medium text-[var(--text-tertiary)] sm:inline">{o.kind}</span>
                    <ArrowUpRight size={18} className="-translate-x-1 text-[var(--text-tertiary)] opacity-0 transition-all group-hover:translate-x-0 group-hover:text-[var(--accent)] group-hover:opacity-100" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* BAND 5 — features */}
      <section id="features" className="bg-[var(--bg-base)]">
        <FadeUp className={`pt-20 sm:pt-28 ${EDGE}`}>
          <p className="text-sm font-medium text-[var(--text-tertiary)]">03 — For organizers</p>
          <h2 className="mt-3 max-w-2xl font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.04] tracking-[-0.02em] text-[var(--text-primary)]">From the poster to the report — handled.</h2>
        </FadeUp>
        <div className="mt-12 grid grid-cols-1 gap-px border-y border-[var(--glass-border)] bg-[var(--glass-border)] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeUp key={f.title} delay={(i % 3) * 0.06} className="flex h-full flex-col bg-[var(--bg-base)] px-[clamp(1.25rem,4vw,5rem)] py-10 sm:px-8 lg:px-9">
                <span className="font-mono text-sm tabular-nums text-[var(--text-tertiary)]">{String(i + 1).padStart(2, "0")}</span>
                <Icon size={22} strokeWidth={1.75} className="mt-5 text-[var(--accent)]" aria-hidden="true" />
                <h3 className="mt-4 font-display text-xl font-semibold text-[var(--text-primary)]">{f.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">{f.body}</p>
              </FadeUp>
            );
          })}
        </div>
      </section>

      {/* BAND 6 — CTA */}
      <section className={`py-24 sm:py-32 ${EDGE}`} style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)" }}>
        <FadeUp className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="max-w-xl font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.04] tracking-[-0.02em] text-white">Run your next event here.</h2>
            <p className="mt-4 max-w-md text-white/85">Organizers across ADU publish, track, and document events in one workspace.</p>
          </div>
          <Link href="/admin" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[var(--accent-strong)] transition-transform active:scale-[0.98]">
            Sign in to get started <ArrowRight size={17} />
          </Link>
        </FadeUp>
      </section>
    </>
  );
}
