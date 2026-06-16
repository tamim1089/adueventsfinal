import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Mic, Users, BookOpen, type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Empowered Ed Series",
  description: "ADU Al Ain Campus — a faculty-development talk series on teaching, learning, and inclusive education.",
};

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

const SESSIONS: { n: string; title: string; speaker: string; when: string; icon: LucideIcon }[] = [
  { n: "01", title: "Universal Design for Learning, in practice", speaker: "Dr. Mohamed Fteiha", when: "May 6 · 2 hrs", icon: BookOpen },
  { n: "02", title: "Assessment that actually measures learning", speaker: "Ms. Deenaz Kanji", when: "May 20 · 90 min", icon: GraduationCap },
  { n: "03", title: "Inclusive classrooms & accessible content", speaker: "Dr. Areej Ahmed", when: "Jun 3 · 2 hrs", icon: Users },
  { n: "04", title: "AI as a teaching assistant, responsibly", speaker: "Panel · ADU Faculty", when: "Jun 17 · 2 hrs", icon: Mic },
];

export default function EmpoweredEdSeriesPage() {
  return (
    <>
      {/* intro band */}
      <section className={`border-b border-[var(--glass-border)] bg-[var(--bg-base)] pb-16 pt-28 sm:pb-20 ${EDGE}`}>
        <p className="text-sm font-medium text-[var(--accent)]">Abu Dhabi University · Al Ain Campus</p>
        <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-[var(--text-primary)]">
          Empowered Ed Series.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
          A faculty-development talk series on teaching, learning, and inclusive
          education — open to all ADU educators and partner schools. Each session
          carries certified contact hours.
        </p>
        <Link
          href="/events"
          className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.98]"
          style={{ background: "var(--accent)" }}
        >
          See upcoming sessions <ArrowRight size={17} />
        </Link>
      </section>

      {/* sessions */}
      <section className={`bg-[var(--bg-base)] py-20 sm:py-24 ${EDGE}`}>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">This term</p>
        <h2 className="mt-3 font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)]">
          Four sessions, one goal.
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-px border-y border-[var(--glass-border)] bg-[var(--glass-border)] sm:grid-cols-2">
          {SESSIONS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.n} className="flex flex-col bg-[var(--bg-base)] p-7 sm:p-9">
                <div className="flex items-center justify-between">
                  <Icon size={22} strokeWidth={1.75} className="text-[var(--accent)]" />
                  <span className="font-mono text-sm tabular-nums text-[var(--text-tertiary)]">{s.n}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold leading-snug text-[var(--text-primary)]">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{s.speaker}</p>
                <p className="mt-4 font-mono text-xs tabular-nums text-[var(--text-tertiary)]">{s.when}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section
        className={`py-24 sm:py-28 ${EDGE}`}
        style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)" }}
      >
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="max-w-xl font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.04] tracking-[-0.02em] text-white">
              Join the series.
            </h2>
            <p className="mt-4 max-w-md text-white/85">
              Register for a session and earn a certificate of attendance from the
              Al Ain Campus.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[var(--accent-strong)] transition-transform active:scale-[0.98]"
          >
            Browse sessions <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}
