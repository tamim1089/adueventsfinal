import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays, Radio, BadgeCheck, MessageSquareText,
  Images, FileBarChart, Users, TrendingUp, Clock,
  ArrowUpRight, Plus, Bell, Search, ChevronRight,
  Activity, Award, ClipboardList,
} from "lucide-react";

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

const KPIS = [
  { value: "—", label: "Published events",  icon: CalendarDays,      delta: null },
  { value: "—", label: "Live now",          icon: Radio,             delta: null },
  { value: "—", label: "Certificates",      icon: BadgeCheck,        delta: null },
  { value: "—", label: "Survey responses",  icon: MessageSquareText, delta: null },
];

const QUICK_ACTIONS = [
  { label: "Create event",      icon: Plus,          desc: "Publish a new event"           },
  { label: "Upload attendance", icon: Users,          desc: "Import CSV or scan QR codes"   },
  { label: "Issue certificates",icon: BadgeCheck,     desc: "Send to verified attendees"    },
  { label: "Add photos",        icon: Images,         desc: "Document the event"            },
  { label: "New survey",        icon: MessageSquareText, desc: "Collect post-event feedback"},
  { label: "Download report",   icon: FileBarChart,   desc: "Export PDF or Excel"           },
];

const RECENT = [
  { title: "Founders & Funding Night", org: "Innovation Center", when: "Today · 6:00 PM",   status: "live"     },
  { title: "Robotics Showcase",         org: "College of Eng.",  when: "Today · 6:30 PM",   status: "live"     },
  { title: "Research Skills Workshop",  org: "Library",          when: "Tomorrow · 11 AM",  status: "upcoming" },
  { title: "Industry Career Fair",      org: "Admission",        when: "Thu · 10:00 AM",    status: "upcoming" },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>

      {/* ── Top Nav Bar ── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b px-6 py-3"
        style={{
          background: "var(--glass-fill)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderColor: "var(--glass-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
            ← ADU Events
          </Link>
          <span style={{ color: "var(--glass-border)" }}>|</span>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div
            className="hidden md:flex items-center gap-2 rounded-full px-4 py-2 text-sm"
            style={{ background: "var(--bg-subtle)", color: "var(--text-tertiary)" }}
          >
            <Search size={14} />
            <span>Search events…</span>
          </div>
          {/* Notifications */}
          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ color: "var(--text-secondary)" }}
          >
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
          </button>
          {/* Avatar */}
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm text-white"
            style={{ background: "var(--accent)" }}
          >
            A
          </div>
        </div>
      </header>

      <div className="flex">

        {/* ── Sidebar ── */}
        <aside
          className="hidden lg:flex flex-col gap-1 sticky top-[57px] h-[calc(100vh-57px)] w-64 shrink-0 overflow-y-auto p-4 border-r"
          style={{
            background: "var(--glass-fill)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            borderColor: "var(--glass-border)",
          }}
        >
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
            Navigation
          </p>
          {NAV_ITEMS.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.label}
                className={`flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-sm transition-all ${
                  n.active ? "font-semibold" : "hover:bg-[var(--bg-subtle)]"
                }`}
                style={n.active ? { background: "var(--accent)", color: "#fff" } : { color: "var(--text-secondary)" }}
              >
                <Icon size={16} />
                {n.label}
                {n.active && <ChevronRight size={14} className="ml-auto" />}
              </button>
            );
          })}

          {/* Sidebar footer */}
          <div className="mt-auto pt-4 border-t" style={{ borderColor: "var(--glass-border)" }}>
            <div
              className="rounded-[14px] p-3"
              style={{ background: "var(--accent-soft)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--accent-strong)" }}>Connect Supabase</p>
              <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                Add your credentials to enable live data.
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 space-y-6">

          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                Overview
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Your department's events at a glance.
              </p>
            </div>
            <button
              className="flex items-center gap-2 h-11 rounded-full px-5 text-sm font-semibold text-white shadow-lg transition-transform active:scale-[0.97]"
              style={{ background: "var(--accent)" }}
            >
              <Plus size={16} /> New event
            </button>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {KPIS.map((k) => {
              const Icon = k.icon;
              return (
                <div
                  key={k.label}
                  className="relative overflow-hidden rounded-[22px] p-5 border"
                  style={{
                    background: "var(--glass-fill-strong)",
                    backdropFilter: "blur(16px) saturate(160%)",
                    WebkitBackdropFilter: "blur(16px) saturate(160%)",
                    borderColor: "var(--glass-border)",
                    boxShadow: "var(--glass-shadow)",
                  }}
                >
                  {/* Icon badge */}
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}
                  >
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <p className="mt-4 font-display text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {k.value}
                  </p>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>{k.label}</p>

                  {/* Decorative glow blob */}
                  <div
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20"
                    style={{ background: "var(--accent)", filter: "blur(30px)" }}
                  />
                </div>
              );
            })}
          </div>

          {/* Two-column: quick actions + recent events */}
          <div className="grid gap-5 lg:grid-cols-5">

            {/* Quick actions (3 cols) */}
            <section
              className="lg:col-span-3 rounded-[22px] border p-5"
              style={{
                background: "var(--glass-fill)",
                backdropFilter: "blur(16px) saturate(160%)",
                WebkitBackdropFilter: "blur(16px) saturate(160%)",
                borderColor: "var(--glass-border)",
                boxShadow: "var(--glass-shadow)",
              }}
            >
              <h2 className="mb-4 font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Quick actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.label}
                      className="group flex items-start gap-3 rounded-[16px] border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                      style={{
                        background: "var(--bg-elevated)",
                        borderColor: "var(--glass-border)",
                      }}
                    >
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors group-hover:bg-[var(--accent)] group-hover:text-white"
                        style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}
                      >
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{a.label}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{a.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Recent events (2 cols) */}
            <section
              className="lg:col-span-2 rounded-[22px] border p-5"
              style={{
                background: "var(--glass-fill)",
                backdropFilter: "blur(16px) saturate(160%)",
                WebkitBackdropFilter: "blur(16px) saturate(160%)",
                borderColor: "var(--glass-border)",
                boxShadow: "var(--glass-shadow)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  Recent
                </h2>
                <button className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent)" }}>
                  All events <ArrowUpRight size={12} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {RECENT.map((r) => (
                  <div
                    key={r.title}
                    className="flex items-center gap-3 rounded-[14px] border p-3 transition-all hover:border-[var(--accent)]/30"
                    style={{ background: "var(--bg-elevated)", borderColor: "var(--glass-border)" }}
                  >
                    <span
                      className="flex h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: r.status === "live" ? "var(--accent)" : "var(--text-tertiary)" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{r.title}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{r.org}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                        <Clock size={10} /> {r.when}
                      </p>
                      {r.status === "live" && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase mt-1"
                          style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}
                        >
                          <Radio size={8} /> Live
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Activity chart placeholder */}
          <section
            className="rounded-[22px] border p-5"
            style={{
              background: "var(--glass-fill)",
              backdropFilter: "blur(16px) saturate(160%)",
              WebkitBackdropFilter: "blur(16px) saturate(160%)",
              borderColor: "var(--glass-border)",
              boxShadow: "var(--glass-shadow)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  Activity
                </h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Event registrations this month</p>
              </div>
              <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--accent)" }}>
                <TrendingUp size={16} /> Connect Supabase for live data
              </span>
            </div>
            {/* Bar chart placeholder */}
            <div className="flex items-end gap-2 h-32">
              {[40,65,30,80,55,90,45,70,60,85,50,75].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md transition-all hover:opacity-80" style={{
                  height: `${h}%`,
                  background: i === 7
                    ? "var(--accent)"
                    : "linear-gradient(to top, var(--accent-soft), transparent)",
                  border: "1px solid var(--glass-border)",
                }} />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </section>

          {/* Setup CTA — only shown when Supabase not connected */}
          <div
            className="rounded-[22px] border p-6 text-center"
            style={{
              background: "var(--glass-fill)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderColor: "var(--glass-border)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Connect Supabase and run the schema to start managing live data.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold"
              style={{ color: "var(--accent-strong)" }}
            >
              ← Back to public site
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
