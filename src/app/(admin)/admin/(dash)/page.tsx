import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Radio, BadgeCheck, MessageSquareText, Plus, ArrowUpRight, Clock, Users, Images, FileBarChart } from "lucide-react";
import { requireAdmin, getOverview } from "@/lib/admin/db";

export const metadata: Metadata = { title: "Dashboard" };

const QUICK = [
  { href: "/admin/events/new", icon: Plus, label: "Create event", desc: "Publish a new event" },
  { href: "/admin/attendance", icon: Users, label: "Attendance", desc: "View & import registrants" },
  { href: "/admin/certificates", icon: BadgeCheck, label: "Certificates", desc: "Issue & send to attendees" },
  { href: "/admin/photos", icon: Images, label: "Add photos", desc: "Document the event" },
  { href: "/admin/surveys", icon: MessageSquareText, label: "New survey", desc: "Collect feedback" },
  { href: "/admin/reports", icon: FileBarChart, label: "Reports", desc: "Export PDF or Excel" },
];

export default async function Overview() {
  const { sb } = await requireAdmin();
  const o = await getOverview(sb);

  const KPIS = [
    { icon: CalendarDays, value: o.published, label: "Published events" },
    { icon: Radio, value: o.liveNow, label: "Live now" },
    { icon: BadgeCheck, value: o.certificates, label: "Certificates" },
    { icon: MessageSquareText, value: o.surveyResponses, label: "Survey responses" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-tertiary)]">Overview</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            Your department, at a glance.
          </h1>
        </div>
        <Link href="/admin/events/new" className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.97]" style={{ background: "var(--accent)" }}>
          <Plus size={16} /> New event
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-px border border-[var(--glass-border)] bg-[var(--glass-border)] lg:grid-cols-4" style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}>
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="flex flex-col gap-3 bg-[var(--bg-base)] p-6">
              <Icon size={18} strokeWidth={1.75} className="text-[var(--accent)]" />
              <p className="font-mono text-4xl font-semibold tabular-nums text-[var(--text-primary)]">{k.value}</p>
              <p className="text-xs font-medium text-[var(--text-tertiary)]">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="text-sm font-medium text-[var(--text-tertiary)]">Quick actions</h2>
          <div className="mt-4 grid grid-cols-1 gap-px border border-[var(--glass-border)] bg-[var(--glass-border)] sm:grid-cols-2" style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}>
            {QUICK.map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.label} href={a.href} className="group flex items-start gap-3 bg-[var(--bg-base)] p-5 transition-colors hover:bg-[var(--bg-subtle)]">
                  <Icon size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{a.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{a.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--text-tertiary)]">Recent</h2>
            <Link href="/admin/events" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">All events <ArrowUpRight size={12} /></Link>
          </div>
          <ul className="mt-4 border-y border-[var(--glass-border)] divide-y divide-[var(--glass-border)]">
            {o.recent.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/events/${r.id}/edit`} className="flex items-center gap-3 py-3.5 transition-colors hover:bg-[var(--bg-subtle)]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.status === "published" ? "var(--accent)" : "var(--text-tertiary)" }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{r.title}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{r.organizer}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                    <Clock size={11} /> {new Date(r.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
