"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Radio, CalendarDays, Users, BadgeCheck, Clock, MapPin } from "lucide-react";

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

const KPIS = [
  { icon: CalendarDays, value: "6", label: "Today" },
  { icon: Radio, value: "2", label: "Live now" },
  { icon: Users, value: "1.2k", label: "Attending" },
  { icon: BadgeCheck, value: "240", label: "Certificates" },
];

const ROWS = [
  { org: "Innovation Center", title: "Founders & Funding Night", when: "6:00 PM", where: "Auditorium A", live: true },
  { org: "College of Engineering", title: "Robotics Showcase", when: "6:30 PM", where: "Lab Building 2", live: true },
  { org: "Library", title: "Research Skills Workshop", when: "11:00 AM", where: "Learning Commons", live: false },
];

// A clean mini "Happening now" screen rendered inside the tablet frame.
function DashboardMock() {
  return (
    <div className="flex h-full w-full flex-col bg-[var(--bg-base)] text-left">
      {/* browser bar — a light nod to the old "screen" framing */}
      <div className="flex items-center gap-2 border-b border-[var(--glass-border)] px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--glass-border)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--glass-border)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--glass-border)]" />
        </span>
        <span className="mx-auto rounded-full border border-[var(--glass-border)] px-4 py-1 font-mono text-[0.625rem] text-[var(--text-tertiary)]">
          events.adu.ac.ae
        </span>
      </div>

      {/* content */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--text-tertiary)]">
              Innovation Center
            </p>
            <h3 className="mt-1 font-display text-xl font-bold tracking-[-0.01em] text-[var(--text-primary)] sm:text-2xl">
              Happening now
            </h3>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ background: "var(--accent)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> 2 live
          </span>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-4 gap-px border border-[var(--glass-border)] bg-[var(--glass-border)]" style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}>
          {KPIS.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="flex flex-col gap-1.5 bg-[var(--bg-base)] p-3 sm:p-4">
                <Icon size={14} className="text-[var(--accent)]" />
                <span className="font-mono text-lg font-semibold tabular-nums leading-none text-[var(--text-primary)] sm:text-2xl">
                  {k.value}
                </span>
                <span className="text-xs font-medium text-[var(--text-tertiary)] sm:text-[0.625rem]">
                  {k.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* event rows */}
        <ul className="border-y border-[var(--glass-border)] divide-y divide-[var(--glass-border)]">
          {ROWS.map((r) => (
            <li key={r.title} className="flex items-center gap-3 py-2.5 sm:py-3">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: r.live ? "var(--accent)" : "var(--text-tertiary)" }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-semibold text-[var(--text-primary)] sm:text-sm">
                  {r.title}
                </p>
                <p className="text-xs font-medium text-[var(--text-tertiary)]">
                  {r.org}
                </p>
              </div>
              <span className="hidden shrink-0 items-center gap-3 font-mono text-[0.625rem] tabular-nums text-[var(--text-secondary)] sm:flex">
                <span className="inline-flex items-center gap-1"><Clock size={10} /> {r.when}</span>
                <span className="inline-flex items-center gap-1"><MapPin size={10} /> {r.where}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function TabletShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const rotate = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1]);

  return (
    <section className="relative overflow-hidden border-b border-[var(--glass-border)] bg-[var(--bg-base)] py-20 sm:py-28">
      {/* editorial shapes — desktop only */}
      <span className="pointer-events-none absolute left-[8%] top-24 hidden h-40 w-40 rounded-full border border-[var(--glass-border)] lg:block" aria-hidden="true" />
      <span className="pointer-events-none absolute right-[12%] top-40 hidden h-2.5 w-2.5 rounded-full lg:block" style={{ background: "var(--accent)" }} aria-hidden="true" />

      <div className={`relative ${EDGE}`}>
        <p className="text-sm font-medium text-[var(--accent)]">For everyone at ADU</p>
        <h2 className="mt-3 max-w-3xl font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.0] tracking-[-0.02em] text-[var(--text-primary)]">
          Everything at ADU,<br />in one place.
        </h2>
      </div>

      {/* ── MOBILE: portrait phone frame — fits perfectly in any mobile viewport ── */}
      <div className="mt-10 flex justify-center px-6 md:hidden">
        <div
          className="w-full max-w-[260px] overflow-hidden border-[5px] border-[var(--text-primary)] bg-[var(--text-primary)] shadow-2xl"
          style={{ borderRadius: 30, aspectRatio: "9 / 17" }}
        >
          <div className="h-full w-full overflow-hidden" style={{ borderRadius: 24 }}>
            <DashboardMock />
          </div>
        </div>
      </div>

      {/* ── TABLET / DESKTOP: landscape tablet with tilt-in animation ── */}
      <div ref={ref} className="mt-14 hidden justify-center px-4 md:flex" style={{ perspective: "1400px" }}>
        <motion.div
          style={reduce ? undefined : { rotateX: rotate, scale, transformOrigin: "center top" }}
          className="w-full max-w-5xl"
        >
          <div
            className="aspect-[16/11] w-full overflow-hidden border-[6px] border-[var(--text-primary)] bg-[var(--text-primary)] shadow-2xl"
            style={{ borderRadius: 28 }}
          >
            <div className="h-full w-full overflow-hidden" style={{ borderRadius: 20 }}>
              <DashboardMock />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
