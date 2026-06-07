import Link from "next/link";
import VideoBackground from "@/components/landing/VideoBackground";
import Reveal from "@/components/landing/Reveal";
import { ORGANIZERS } from "@/lib/organizers";

const FEATURES = [
  { title: "Browse by organizer", body: "Jump straight to any college, department, or center. Eleven organizers, one map." },
  { title: "Posters, dates & venues", body: "Every event carries its poster, schedule, and location — clear at a glance." },
  { title: "Attendance & certificates", body: "Upload attendance, then auto-generate and share certificates in a click." },
  { title: "Post-event surveys", body: "Collect participant feedback with a survey attached to the event." },
  { title: "Photo galleries", body: "Document the day. Highlight campus life with post-event photos." },
  { title: "Reports & annual reviews", body: "Download per-event reports and publish each department's annual report." },
];

const STATS = [
  { value: "11", label: "Organizers" },
  { value: "1", label: "Campus, unified" },
  { value: "100%", label: "On the record" },
];

export default function LandingPage() {
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden">
        <VideoBackground />
        {/* ambient drifting light (atmosphere) */}
        <div className="blob blob-a -left-32 top-10 h-96 w-96" style={{ background: "var(--accent)" }} />
        <div className="blob blob-b right-0 bottom-0 h-[28rem] w-[28rem]" style={{ background: "var(--brand-navy)" }} />

        <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-[var(--text-secondary)] backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
              Abu Dhabi University · Al Ain Campus
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-[var(--text-primary)] sm:text-6xl lg:text-7xl">
              Every campus event.
              <span className="block" style={{ color: "var(--accent-strong)" }}>
                One beautiful place.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
              Discover what&apos;s happening across the colleges, departments, and centers of
              Al Ain Campus — with posters, attendance, certificates, and reports built in.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#events"
                className="inline-flex h-13 items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold text-[var(--accent-on)] shadow-xl transition-transform active:scale-[0.97]"
                style={{ background: "var(--accent)" }}
              >
                Explore events
              </a>
              <Link
                href="/admin"
                className="glass inline-flex h-13 items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold text-[var(--text-primary)] transition-transform active:scale-[0.97]"
              >
                Organizer sign in
              </Link>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <dl className="mt-16 flex flex-wrap gap-x-12 gap-y-6">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-4xl font-bold text-[var(--text-primary)]">
                    {s.value}
                  </dd>
                  <p className="mt-1 text-sm text-[var(--text-tertiary)]">{s.label}</p>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ============ EVENTS TEASER ============ */}
      <section id="events" className="relative mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--accent-strong)" }}>
            Happening now
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight text-[var(--text-primary)] sm:text-5xl">
            Live events, the moment they go live.
          </h2>
          <p className="mt-4 max-w-xl text-[var(--text-secondary)]">
            Overlapping sessions are surfaced side by side, so nothing on campus gets missed.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { tag: "Innovation Center", title: "Founders & Funding Night", when: "Today · 6:00 PM", where: "Auditorium A" },
            { tag: "College of Engineering", title: "Robotics Showcase", when: "Today · 6:30 PM", where: "Lab Building 2" },
            { tag: "Library", title: "Research Skills Workshop", when: "Tomorrow · 11:00 AM", where: "Learning Commons" },
          ].map((e, i) => (
            <Reveal key={e.title} delay={i * 90}>
              <article className="faux-glass h-full p-6">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                  <span className="truncate text-xs font-medium text-[var(--text-tertiary)]">{e.tag}</span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {e.title}
                </h3>
                <div className="mt-5 space-y-1.5 text-sm">
                  <p className="font-medium text-[var(--text-primary)]">{e.when}</p>
                  <p className="text-[var(--text-secondary)]">{e.where}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ ORGANIZERS ============ */}
      <section id="organizers" className="relative overflow-hidden py-24">
        <div className="blob blob-a left-1/4 top-0 h-80 w-80" style={{ background: "var(--brand-navy)" }} />
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--accent-strong)" }}>
              Organizers
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl">
              Eleven ways in.
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ORGANIZERS.map((o, i) => (
              <Reveal key={o.slug} delay={(i % 4) * 60}>
                <a
                  href={`#events`}
                  className="faux-glass flex h-full min-h-24 flex-col justify-between p-4 transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    {o.kind}
                  </span>
                  <span className="mt-2 text-sm font-medium leading-snug text-[var(--text-primary)]">
                    {o.name}
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--accent-strong)" }}>
            Built for organizers
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight text-[var(--text-primary)] sm:text-5xl">
            From the poster to the report — handled.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 80}>
              <div className="faux-glass h-full p-6">
                <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ CTA BAND ============ */}
      <section className="relative mx-auto max-w-6xl px-6 pb-28">
        <Reveal>
          <div className="glass relative overflow-hidden px-8 py-14 text-center sm:px-16 sm:py-20">
            <div className="blob blob-b right-10 top-0 h-64 w-64" style={{ background: "var(--accent)" }} />
            <h2 className="relative font-display text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">
              Run your next event here.
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-[var(--text-secondary)]">
              Organizers across Al Ain Campus publish, track, and document events in one workspace.
            </p>
            <Link
              href="/admin"
              className="relative mt-8 inline-flex h-13 items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold text-[var(--accent-on)] shadow-xl transition-transform active:scale-[0.97]"
              style={{ background: "var(--accent)" }}
            >
              Sign in to get started
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-[var(--text-tertiary)] sm:flex-row">
          <p>© {new Date().getFullYear()} Abu Dhabi University — Al Ain Campus</p>
          <p>Part of the ADU Apps platform</p>
        </div>
      </footer>
    </>
  );
}
