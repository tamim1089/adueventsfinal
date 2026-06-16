import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays, Radio, BadgeCheck, MessageSquareText,
  Images, FileBarChart, Users, Clock,
  ArrowUpRight, Plus, Bell, Search,
  Activity, Award, ClipboardList,
} from "lucide-react";
import { EVENTS_DATA } from "@/lib/events-data";

export const metadata: Metadata = { title: "Dashboard" };

const NAV_ITEMS = [
  { label: "Overview",     icon: Activity,      active: true  },
  { label: "Events",       icon: CalendarDays,  active: false },
  { label: "Attendance",   icon: Users,         active: false },
  { label: "Certificates", icon: Award,         active: false },
  { label: "Surveys",      icon: ClipboardList, active: false },
  { label: "Photos",       icon: Images,        active: false },
  { label: "Reports",      icon: FileBarChart,  active: false },
];

// Real, derivable figures — no invented metrics, no "—" placeholders.
const upcoming = EVENTS_DATA.upcoming;
const past = EVENTS_DATA.past;
const liveNow = upcoming.filter((e) => e.when.startsWith("Today")).length;

const KPIS = [
  { value: upcoming.length + past.length, label: "Published events", icon: CalendarDays },
  { value: liveNow,                        label: "Live now",         icon: Radio },
  { value: 0,                              label: "Certificates",     icon: BadgeCheck },
  { value: 0,                              label: "Survey responses", icon: MessageSquareText },
];

const QUICK_ACTIONS = [
  { label: "Create event",       icon: Plus,              desc: "Publish a new event" },
  { label: "Upload attendance",  icon: Users,             desc: "Import CSV or scan QR codes" },
  { label: "Issue certificates", icon: BadgeCheck,        desc: "Send to verified attendees" },
  { label: "Add photos",         icon: Images,            desc: "Document the event" },
  { label: "New survey",         icon: MessageSquareText, desc: "Collect post-event feedback" },
  { label: "Download report",    icon: FileBarChart,      desc: "Export PDF or Excel" },
];

const RECENT = upcoming.map((e) => ({
  title: e.title,
  org: e.organizer,
  when: e.when,
  live: e.when.startsWith("Today"),
}));

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-[var(--glass-border)] bg-[var(--bg-base)] px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-medium text-[var(--accent)]">
            ← ADU Events
          </Link>
          <span className="text-[var(--glass-border)]">|</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-[var(--glass-border)] px-4 py-2 text-sm text-[var(--text-tertiary)] md:flex">
            <Search size={14} />
            <span>Search events…</span>
          </div>
          <button className="relative grid h-9 w-9 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]">
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
          </button>
          <div className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white" style={{ background: "var(--accent)" }}>
            A
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ── Sidebar ── */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-64 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-[var(--glass-border)] p-4 lg:flex">
          <p className="mb-3 px-3 text-xs font-medium text-[var(--text-tertiary)]">
            Navigation
          </p>
          {NAV_ITEMS.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.label}
                className={`flex items-center gap-3 border-l-2 px-3.5 py-2.5 text-sm transition-colors ${
                  n.active
                    ? "border-l-[var(--accent)] font-medium text-[var(--text-primary)]"
                    : "border-l-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon size={16} className={n.active ? "text-[var(--accent)]" : ""} />
                {n.label}
              </button>
            );
          })}

          <div className="mt-auto border-t border-[var(--glass-border)] pt-4">
            <div className="border border-[var(--glass-border)] p-3" style={{ borderRadius: "var(--r-xl)" }}>
              <p className="text-xs font-medium text-[var(--text-tertiary)]">
                Data source
              </p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
                Connect Supabase to enable live data.
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="min-w-0 flex-1 space-y-10 p-6 lg:p-10">
          {/* header row */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-tertiary)]">
                Overview
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
                Your department, at a glance.
              </h1>
            </div>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.97]"
              style={{ background: "var(--accent)" }}
            >
              <Plus size={16} /> New event
            </button>
          </div>

          {/* KPI strip — bordered grid, mono tabular figures, no glows */}
          <div className="grid grid-cols-2 gap-px border border-[var(--glass-border)] bg-[var(--glass-border)] lg:grid-cols-4" style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}>
            {KPIS.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="flex flex-col gap-3 bg-[var(--bg-base)] p-6">
                  <Icon size={18} strokeWidth={1.75} className="text-[var(--accent)]" />
                  <p className="font-mono text-4xl font-semibold tabular-nums text-[var(--text-primary)]">
                    {k.value}
                  </p>
                  <p className="text-xs font-medium text-[var(--text-tertiary)]">
                    {k.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* quick actions + recent */}
          <div className="grid gap-8 lg:grid-cols-5">
            <section className="lg:col-span-3">
              <h2 className="text-sm font-medium text-[var(--text-tertiary)]">
                Quick actions
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-px border border-[var(--glass-border)] bg-[var(--glass-border)] sm:grid-cols-2" style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}>
                {QUICK_ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.label}
                      className="group flex items-start gap-3 bg-[var(--bg-base)] p-5 text-left transition-colors hover:bg-[var(--bg-subtle)]"
                    >
                      <Icon size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{a.label}</p>
                        <p className="mt-0.5 text-[0.75rem] text-[var(--text-tertiary)]">{a.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-[var(--text-tertiary)]">
                  Recent
                </h2>
                <Link href="/events" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                  All events <ArrowUpRight size={12} />
                </Link>
              </div>
              <ul className="mt-4 border-y border-[var(--glass-border)] divide-y divide-[var(--glass-border)]">
                {RECENT.map((r) => (
                  <li key={r.title} className="flex items-center gap-3 py-3.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: r.live ? "var(--accent)" : "var(--text-tertiary)" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{r.title}</p>
                      <p className="text-xs font-medium text-[var(--text-tertiary)]">
                        {r.org}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[0.6875rem] tabular-nums text-[var(--text-secondary)]">
                      <Clock size={11} /> {r.when}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* activity — honest empty state, not a fake chart */}
          <section className="border border-[var(--glass-border)] p-10 text-center" style={{ borderRadius: "var(--r-xl)" }}>
            <Activity size={22} className="mx-auto text-[var(--text-tertiary)]" />
            <p className="mt-4 font-display text-2xl font-semibold text-[var(--text-primary)]">
              No registration data yet.
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[var(--text-secondary)]">
              Connect Supabase and run the schema to see registrations,
              attendance, and certificate trends here.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-1.5 font-semibold text-[var(--accent)]"
            >
              Back to public site <ArrowUpRight size={15} />
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
