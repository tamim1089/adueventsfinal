import { requireAdmin, listEvents } from "@/lib/admin/db";

export const metadata = { title: "Reports" };

export default async function Reports() {
  const { sb } = await requireAdmin();
  const events = await listEvents(sb);
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Reports</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">Event reports</h1>
        <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">Per-event report (registrations, attendance, certificates). Export to PDF/Excel is the next module; the data is wired below.</p>
      </div>
      <div className="overflow-hidden border border-[var(--glass-border)]" style={{ borderRadius: "var(--r-xl)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-subtle)] text-left text-xs font-medium text-[var(--text-tertiary)]">
              <th className="px-4 py-3">Event</th><th className="px-4 py-3">When</th><th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-[var(--glass-border)] last:border-0">
                <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{e.title}</td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-[var(--text-secondary)]">{new Date(e.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                <td className="px-4 py-3 capitalize text-[var(--text-secondary)]">{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
