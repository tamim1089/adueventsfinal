import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { requireAdmin, listEvents } from "@/lib/admin/db";
import { setEventStatus, deleteEvent } from "@/app/(admin)/admin/actions";

export const metadata = { title: "Events" };

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function EventsAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { sb } = await requireAdmin();
  const { q } = await searchParams;
  let events = await listEvents(sb);
  if (q) {
    const needle = q.toLowerCase();
    events = events.filter((e) => `${e.title} ${e.organizer} ${e.location ?? ""}`.toLowerCase().includes(needle));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-tertiary)]">Manage</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            Events {q ? <span className="text-[var(--text-tertiary)]">· “{q}”</span> : null}
          </h1>
        </div>
        <Link href="/admin/events/new" className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-[var(--accent-on)]" style={{ background: "var(--accent)" }}>
          <Plus size={16} /> New event
        </Link>
      </div>

      <div className="overflow-hidden border border-[var(--glass-border)]" style={{ borderRadius: "var(--r-xl)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-subtle)] text-left text-xs font-medium text-[var(--text-tertiary)]">
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3">Audience</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--text-secondary)]">No events. Create one →</td></tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="border-b border-[var(--glass-border)] last:border-0 align-middle">
                <td className="px-4 py-3">
                  <p className="font-semibold text-[var(--text-primary)]">{e.title}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{e.organizer}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-[var(--text-secondary)]">{fmt(e.starts_at)}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{e.location ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-xs capitalize text-[var(--text-secondary)]">{e.audience}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs capitalize text-[var(--text-secondary)]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: e.status === "published" ? "var(--accent)" : "var(--text-tertiary)" }} />
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/events/${e.id}/edit`} className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]">
                      <Pencil size={12} /> Edit
                    </Link>
                    <form action={setEventStatus.bind(null, e.id, e.status === "published" ? "draft" : "published")}>
                      <button className="rounded-full border border-[var(--glass-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]">
                        {e.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <form action={deleteEvent.bind(null, e.id)}>
                      <button className="rounded-full px-3 py-1.5 text-xs font-medium text-[var(--danger)] transition-colors hover:underline">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
