import Link from "next/link";
import { requireAdmin, listEvents } from "@/lib/admin/db";

export const metadata = { title: "Attendance" };

export default async function Attendance() {
  const { sb } = await requireAdmin();
  const events = await listEvents(sb);
  const { data: rows } = await sb.from("attendees").select("event_id");
  const counts: Record<string, number> = {};
  for (const r of rows ?? []) counts[r.event_id as string] = (counts[r.event_id as string] ?? 0) + 1;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Attendance</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">Registrations</h1>
        <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">Everyone who registers for an event appears here. After an event ends, issue certificates from the Certificates page.</p>
      </div>
      <div className="overflow-hidden border border-[var(--glass-border)]" style={{ borderRadius: "var(--r-xl)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-subtle)] text-left text-xs font-medium text-[var(--text-tertiary)]">
              <th className="px-4 py-3">Event</th><th className="px-4 py-3">Audience</th><th className="px-4 py-3 text-right">Registered</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-[var(--glass-border)] last:border-0">
                <td className="px-4 py-3"><Link href={`/admin/events/${e.id}/edit`} className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">{e.title}</Link><p className="text-xs text-[var(--text-tertiary)]">{e.organizer}</p></td>
                <td className="px-4 py-3 capitalize text-[var(--text-secondary)]">{e.audience}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--text-primary)]">{counts[e.id] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
