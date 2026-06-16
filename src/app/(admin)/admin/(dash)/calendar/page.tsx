import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/db";

export const metadata = { title: "Calendar" };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function Calendar({ searchParams }: { searchParams: Promise<{ o?: string }> }) {
  const { sb } = await requireAdmin();
  const { o } = await searchParams;
  const offset = Number.parseInt(o ?? "0") || 0;

  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const dow = (base.getDay() + 6) % 7; // Monday = 0
  const weekStart = new Date(base);
  weekStart.setDate(base.getDate() - dow + offset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const { data } = await sb
    .from("events")
    .select("id, title, starts_at, ends_at, location, status")
    .gte("starts_at", weekStart.toISOString())
    .lt("starts_at", weekEnd.toISOString())
    .order("starts_at", { ascending: true });
  const events = data ?? [];

  const byDay: Record<number, typeof events> = {};
  for (const e of events) {
    const d = (new Date(e.starts_at as string).getDay() + 6) % 7;
    (byDay[d] ??= []).push(e);
  }

  const todayIdx = offset === 0 ? dow : -1;
  const label = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(weekEnd.getTime() - 1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-tertiary)]">Plan</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">Weekly calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/calendar?o=${offset - 1}`} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"><ChevronLeft size={16} /></Link>
          <span className="min-w-36 text-center font-mono text-sm tabular-nums text-[var(--text-secondary)]">{label}</span>
          <Link href={`/admin/calendar?o=${offset + 1}`} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"><ChevronRight size={16} /></Link>
          {offset !== 0 && <Link href="/admin/calendar" className="rounded-full border border-[var(--glass-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]">Today</Link>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px border border-[var(--glass-border)] bg-[var(--glass-border)] sm:grid-cols-7" style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}>
        {DAYS.map((d, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const dayEvents = byDay[i] ?? [];
          return (
            <div key={d} className="min-h-44 bg-[var(--bg-base)] p-3">
              <div className="flex items-baseline justify-between">
                <span className={`text-xs font-medium ${i === todayIdx ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}>{d}</span>
                <span className={`font-mono text-sm tabular-nums ${i === todayIdx ? "font-bold text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}>{date.getDate()}</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {dayEvents.map((e) => (
                  <Link
                    key={e.id}
                    href={`/admin/events/${e.id}/edit`}
                    className="block rounded-lg border-l-2 bg-[var(--bg-subtle)] px-2 py-1.5 transition-colors hover:bg-[var(--bg-elevated)]"
                    style={{ borderLeftColor: e.status === "published" ? "var(--accent)" : "var(--text-tertiary)" }}
                  >
                    <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{e.title}</p>
                    <p className="font-mono text-[0.625rem] tabular-nums text-[var(--text-tertiary)]">
                      {new Date(e.starts_at as string).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · {e.location ?? "—"}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        Click any event to open its admin detail and edit it. New events that overlap another event in the same venue are blocked.{" "}
        <Link href="/admin/events/new" className="inline-flex items-center gap-1 font-semibold text-[var(--accent)]"><Plus size={13} /> New event</Link>
      </p>
    </div>
  );
}
