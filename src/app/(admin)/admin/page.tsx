import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

const NAV = [
  { label: "Overview", active: true },
  { label: "Events" },
  { label: "Attendance" },
  { label: "Certificates" },
  { label: "Surveys" },
  { label: "Photos" },
  { label: "Reports" },
];

const KPIS = [
  { value: "—", label: "Published events" },
  { value: "—", label: "Live now" },
  { value: "—", label: "Certificates issued" },
  { value: "—", label: "Survey responses" },
];

// Dashboard scaffold — the working surfaces (events, attendance, certs…) are
// built in the §11 build order. This establishes the admin shell + layout.
export default function AdminDashboard() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6 lg:py-8">
      {/* sidebar (faux-glass, solid enough for dense nav) */}
      <aside className="faux-glass h-fit shrink-0 p-3 lg:sticky lg:top-8 lg:w-60">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <span
            className="grid h-8 w-8 place-items-center rounded-[10px] font-display text-base font-bold text-[var(--accent-on)]"
            style={{ background: "var(--accent)" }}
          >
            A
          </span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Admin
          </span>
        </div>
        <nav className="mt-2 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {NAV.map((n) => (
            <button
              key={n.label}
              className={`shrink-0 rounded-[12px] px-3.5 py-2.5 text-left text-sm transition-colors ${
                n.active
                  ? "font-semibold text-[var(--accent-on)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              style={n.active ? { background: "var(--accent)" } : undefined}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* main */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">
              Overview
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Your department&apos;s events at a glance.
            </p>
          </div>
          <button
            className="h-11 rounded-full px-5 text-sm font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.97]"
            style={{ background: "var(--accent)" }}
          >
            + New event
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label} className="faux-glass p-5">
              <p className="font-display text-3xl font-bold text-[var(--text-primary)]">
                {k.value}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="faux-glass mt-6 p-8 text-center">
          <p className="text-[var(--text-secondary)]">
            Connect Supabase and run the schema to start managing events.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-semibold"
            style={{ color: "var(--accent-strong)" }}
          >
            ← Back to the public site
          </Link>
        </div>
      </div>
    </div>
  );
}
