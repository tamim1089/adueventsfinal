import Link from "next/link";
import Image from "next/image";
import {
  CalendarRange,
  ImageUp,
  BadgeCheck,
  MessageSquareText,
  Images,
  FileBarChart,
  Clock,
  MapPin,
  ArrowUpRight,
  Radio,
} from "lucide-react";
import HeroBackground from "@/components/landing/HeroBackground";
import Reveal from "@/components/landing/Reveal";
import YouTubeEmbed from "@/components/landing/YouTubeEmbed";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { WordsPullUp } from "@/components/ui/prisma-hero";
import { FlowButton } from "@/components/ui/flow-button";
import { ORGANIZERS } from "@/lib/organizers";

const FEATURES = [
  { icon: CalendarRange, title: "Browse by organizer", body: "Jump straight to any college, department, or center. Eleven organizers, one map." },
  { icon: ImageUp, title: "Posters, dates & venues", body: "Every event carries its poster, schedule, and location — clear at a glance." },
  { icon: BadgeCheck, title: "Attendance & certificates", body: "Upload attendance, then auto-generate and share certificates in a click." },
  { icon: MessageSquareText, title: "Post-event surveys", body: "Collect participant feedback with a survey attached to the event." },
  { icon: Images, title: "Photo galleries", body: "Document the day. Highlight campus life with post-event photos." },
  { icon: FileBarChart, title: "Reports & annual reviews", body: "Download per-event reports and publish each department's annual report." },
];

const EVENTS = [
  { tag: "Innovation Center", title: "Founders & Funding Night", when: "Today · 6:00 PM", where: "Auditorium A", live: true },
  { tag: "College of Engineering", title: "Robotics Showcase", when: "Today · 6:30 PM", where: "Lab Building 2", live: true },
  { tag: "Library", title: "Research Skills Workshop", when: "Tomorrow · 11:00 AM", where: "Learning Commons", live: false },
];

const STATS = [
  { value: "11", label: "Organizers" },
  { value: "5", label: "Colleges" },
  { value: "Live", label: "Updates" },
];

export default function LandingPage() {
  return (
    <>
      {/* ============ HERO (dark shader band) ============ */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden">
        <HeroBackground />
        <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-24">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white/80 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
              Abu Dhabi University · Al Ain Campus
            </span>
          </Reveal>

          <h1 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="block text-white">
              <WordsPullUp text="Every campus event," />
            </span>
            <span className="block" style={{ color: "var(--accent)" }}>
              <WordsPullUp text="in one place." />
            </span>
          </h1>

          <Reveal delay={160}>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
              What&apos;s on across Al Ain Campus — every college, department, and center.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#events"
                className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold text-[var(--accent-on)] shadow-xl transition-transform active:scale-[0.97]"
                style={{ background: "var(--accent)" }}
              >
                Explore events
              </a>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-transform active:scale-[0.97] hover:bg-white/10"
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
                  <dd className="font-display text-4xl font-bold text-white">{s.value}</dd>
                  <p className="mt-1 text-sm text-white/55">{s.label}</p>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ============ SHOWCASE (public experience — what anyone sees) ============ */}
      <section id="showcase" className="relative -mt-20">
        <ContainerScroll
          titleComponent={
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                For everyone on campus
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold text-[var(--text-primary)] sm:text-6xl">
                Everything on campus,
                <br />
                <span className="text-4xl md:text-[5rem] font-bold leading-none">in one place.</span>
              </h2>
            </div>
          }
        >
          <Image
            src="/media/showcase-public.png"
            alt="The public Al Ain Campus Events page anyone can browse"
            height={900}
            width={1440}
            className="mx-auto h-full rounded-2xl object-cover object-left-top"
            draggable={false}
            priority
          />
        </ContainerScroll>
      </section>

      {/* ============ EVENTS TEASER ============ */}
      <section id="events" className="relative mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Happening now
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl">
            Live events, the moment they go live.
          </h2>
          <p className="mt-4 max-w-xl text-[var(--text-secondary)]">
            Overlapping sessions are surfaced side by side, so nothing on campus gets missed.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EVENTS.map((e, i) => (
            <Reveal key={e.title} delay={i * 90}>
              <article className="faux-glass card-hover group flex h-full flex-col p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                    <span className="max-w-[10rem] truncate">{e.tag}</span>
                  </span>
                  {e.live && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}
                    >
                      <Radio size={11} strokeWidth={2.5} /> Live
                    </span>
                  )}
                </div>

                <h3 className="mt-4 font-display text-2xl font-semibold leading-tight text-[var(--text-primary)]">
                  {e.title}
                </h3>

                <div className="mt-auto space-y-2 pt-6 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                    <Clock size={15} className="shrink-0 text-[var(--text-tertiary)]" /> {e.when}
                  </p>
                  <p className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <MapPin size={15} className="shrink-0 text-[var(--text-tertiary)]" /> {e.where}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 flex justify-center">
          <Link href="/events">
            <FlowButton text="See all events" />
          </Link>
        </Reveal>
      </section>

      {/* ============ ORGANIZERS ============ */}
      <section id="organizers" className="relative overflow-hidden bg-[var(--bg-subtle)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Organizers
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-[var(--text-primary)] sm:text-5xl">
              Eleven ways in.
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {ORGANIZERS.map((o, i) => (
              <Reveal key={o.slug} delay={(i % 4) * 60}>
                <a
                  href="#events"
                  className="faux-glass card-hover group flex h-full min-h-28 flex-col justify-between p-5"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      {o.kind}
                    </span>
                    <ArrowUpRight
                      size={16}
                      className="text-[var(--text-tertiary)] opacity-0 transition-all group-hover:opacity-100 group-hover:text-[var(--accent)]"
                    />
                  </div>
                  <span className="mt-3 text-sm font-semibold leading-snug text-[var(--text-primary)]">
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
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Built for organizers
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl">
            From the poster to the report — handled.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 3) * 80}>
                <div className="faux-glass card-hover h-full p-6">
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}
                  >
                    <Icon size={22} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-semibold text-[var(--text-primary)]">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{f.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ============ CAMPUS VIDEO ============ */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Life at ADU
          </p>
          <h2 className="mt-3 mb-8 max-w-2xl font-display text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl">
            A look around Al Ain Campus.
          </h2>
          <YouTubeEmbed id="AY_uWLK1LOU" title="Abu Dhabi University — Al Ain Campus" />
        </Reveal>
      </section>

      {/* ============ CTA BAND ============ */}
      <section className="relative mx-auto max-w-6xl px-6 pb-28">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-[28px] px-8 py-14 text-center sm:px-16 sm:py-20"
            style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)" }}
          >
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Run your next event here.</h2>
            <p className="mx-auto mt-4 max-w-md text-white/85">
              Organizers across Al Ain Campus publish, track, and document events in one workspace.
            </p>
            <Link
              href="/admin"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[var(--accent-strong)] shadow-xl transition-transform active:scale-[0.97]"
            >
              Sign in to get started
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-[var(--glass-border)] px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-[var(--text-tertiary)] sm:flex-row">
          <p>© {new Date().getFullYear()} Abu Dhabi University — Al Ain Campus</p>
          <p>Part of the ADU Apps platform</p>
        </div>
      </footer>
    </>
  );
}
