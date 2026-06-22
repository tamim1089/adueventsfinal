import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/db";

export const metadata = { title: "Calendar" };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_START = 7; // 7 AM
const HOUR_END = 23; // 11 PM
const HOURS = HOUR_END - HOUR_START;
const ROW_H = 52; // px per hour

// Abu Dhabi / UAE timezone offset in minutes (UTC+4, no DST)
const TZ_OFFSET_MIN = 4 * 60;

const PALETTE = [
  { bg: "#fde8ea", bar: "#e11d2e", tx: "#7f1420" },
  { bg: "#e7eefc", bar: "#3b6fe0", tx: "#1e3a8a" },
  { bg: "#e8f6ee", bar: "#1f9d57", tx: "#14532d" },
  { bg: "#fff1e0", bar: "#e08a1e", tx: "#7c3a06" },
  { bg: "#f1e9fb", bar: "#7c4ddb", tx: "#4a1d96" },
  { bg: "#fde9f2", bar: "#db2777", tx: "#831843" },
];
function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
const hourLabel = (h: number) => {
  const am = h < 12 || h === 24;
  const v = h % 12 === 0 ? 12 : h % 12;
  return `${v} ${am ? "AM" : "PM"}`;
};

/** Returns the current date/time expressed in Asia/Dubai local time (UTC+4). */
function nowInDubai(): Date {
  const utcMs = Date.now();
  return new Date(utcMs + TZ_OFFSET_MIN * 60 * 1000);
}

export default async function Calendar({ searchParams }: { searchParams: Promise<{ o?: string }> }) {
  const { sb } = await requireAdmin();
  const { o } = await searchParams;
  const offset = Number.parseInt(o ?? "0") || 0;

  // Compute week boundaries in Dubai local time, then convert back to UTC ISO strings for the query.
  const base = nowInDubai();
  base.setHours(0, 0, 0, 0);
  const dow = (base.getDay() + 6) % 7;
  const weekStart = new Date(base);
  weekStart.setDate(base.getDate() - dow + offset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // weekStart/weekEnd are Dubai-local times stored in a JS Date whose internal UTC
  // value is 4h ahead. Shift back by TZ_OFFSET_MIN to get the real UTC boundaries.
  const weekStartUtc = new Date(weekStart.getTime() - TZ_OFFSET_MIN * 60 * 1000);
  const weekEndUtc = new Date(weekEnd.getTime() - TZ_OFFSET_MIN * 60 * 1000);

  const { data } = await sb
    .from("events")
    .select("id, title, starts_at, ends_at, location, status, organizer_id")
    .gte("starts_at", weekStartUtc.toISOString())
    .lt("starts_at", weekEndUtc.toISOString())
    .order("starts_at", { ascending: true });
  const events = data ?? [];

  const todayIdx = offset === 0 ? dow : -1;
  // Use Dubai local time for the "now" indicator position
  const nowDubai = nowInDubai();
  const nowTop = ((nowDubai.getHours() * 60 + nowDubai.getMinutes()) / 60 - HOUR_START) * ROW_H;

  const label = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(weekEnd.getTime() - 1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  // place each event into its day column
  // Convert event times to Dubai local time for correct column/position placement
  const placed = events.map((e) => {
    const sUtc = new Date(e.starts_at as string);
    const enUtc = new Date(e.ends_at as string);
    // Shift to Dubai local time
    const s = new Date(sUtc.getTime() + TZ_OFFSET_MIN * 60 * 1000);
    const en = new Date(enUtc.getTime() + TZ_OFFSET_MIN * 60 * 1000);
    const dayIdx = (s.getDay() + 6) % 7;
    const startH = s.getHours() + s.getMinutes() / 60;
    const endH = en.getHours() + en.getMinutes() / 60;
    let top = (startH - HOUR_START) * ROW_H;
    let height = Math.max((endH - startH) * ROW_H, 30);
    const maxTop = HOURS * ROW_H;
    top = Math.max(0, Math.min(top, maxTop - 30));
    if (top + height > maxTop) height = maxTop - top;
    return { e, dayIdx, top, height, color: colorFor((e.organizer_id as string) || (e.id as string)) };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-tertiary)]">Plan</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">{label}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/calendar?o=${offset - 1}`} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"><ChevronLeft size={16} /></Link>
          {offset !== 0 && <Link href="/admin/calendar" className="rounded-full border border-[var(--glass-border)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-primary)]">Today</Link>}
          <Link href={`/admin/calendar?o=${offset + 1}`} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"><ChevronRight size={16} /></Link>
          <Link href="/admin/events/new" className="ml-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-[var(--accent-on)]" style={{ background: "var(--accent)" }}><Plus size={15} /> New</Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--r-xl)] border border-[var(--glass-border)]">
        <div className="min-w-[820px]">
          {/* day headers */}
          <div className="grid border-b border-[var(--glass-border)]" style={{ gridTemplateColumns: `64px repeat(7, 1fr)` }}>
            <div />
            {DAYS.map((d, i) => {
              const date = new Date(weekStart);
              date.setDate(weekStart.getDate() + i);
              const isToday = i === todayIdx;
              return (
                <div key={d} className="border-l border-[var(--glass-border)] px-3 py-3 text-center">
                  <span className="text-xs font-medium text-[var(--text-tertiary)]">{d.toUpperCase()}</span>
                  <div className="mt-1">
                    <span className={`inline-grid h-8 w-8 place-items-center rounded-full font-mono text-sm tabular-nums ${isToday ? "font-bold text-[var(--accent-on)]" : "text-[var(--text-primary)]"}`} style={isToday ? { background: "var(--accent)" } : undefined}>{date.getDate()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* time grid */}
          <div className="grid" style={{ gridTemplateColumns: `64px repeat(7, 1fr)` }}>
            {/* hour gutter */}
            <div className="relative" style={{ height: HOURS * ROW_H }}>
              {Array.from({ length: HOURS }, (_, i) => HOUR_START + i).map((h) => (
                <div key={h} className="absolute right-2 -translate-y-1/2 text-[0.7rem] text-[var(--text-tertiary)]" style={{ top: (h - HOUR_START) * ROW_H }}>{hourLabel(h)}</div>
              ))}
            </div>

            {/* day columns */}
            {DAYS.map((d, i) => (
              <div key={d} className="relative border-l border-[var(--glass-border)]" style={{ height: HOURS * ROW_H }}>
                {Array.from({ length: HOURS }, (_, k) => k).map((k) => (
                  <div key={k} className="absolute inset-x-0 border-t border-[var(--glass-border)]/70" style={{ top: k * ROW_H }} />
                ))}
                {i === todayIdx && nowTop >= 0 && nowTop <= HOURS * ROW_H && (
                  <div className="absolute inset-x-0 z-20" style={{ top: nowTop }}>
                    <div className="h-px w-full" style={{ background: "var(--accent)" }} />
                    <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
                  </div>
                )}
                {placed.filter((p) => p.dayIdx === i).map((p) => (
                  <Link
                    key={p.e.id}
                    href={`/admin/events/${p.e.id}/edit`}
                    className="absolute inset-x-1 z-10 overflow-hidden rounded-md px-2 py-1 transition-shadow hover:shadow-md"
                    style={{ top: p.top, height: p.height, background: p.color.bg, borderLeft: `3px solid ${p.color.bar}` }}
                  >
                    <p className="truncate text-xs font-semibold leading-tight" style={{ color: p.color.tx }}>{p.e.title}</p>
                    <p className="truncate text-[0.65rem]" style={{ color: p.color.tx, opacity: 0.8 }}>
                      {new Date(p.e.starts_at as string).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      {p.e.location ? ` · ${p.e.location}` : ""}
                    </p>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">Click an event to open its admin detail. Overlapping events in the same venue are blocked at creation.</p>
    </div>
  );
}
