import { requireAdmin, listEvents } from "@/lib/admin/db";
import ReportsClient from "./ReportsClient";

export const metadata = { title: "Reports" };

export default async function Reports() {
  const { sb } = await requireAdmin();
  const events = await listEvents(sb);

  // Attendee counts per event
  const { data: attRows } = await sb.from("attendees").select("event_id, checked_in_at");
  // Certificate counts per event (via attendee_id join)
  const { data: certRows } = await sb
    .from("certificates")
    .select("attendee_id, sent_at")
    .not("sent_at", "is", null);

  // Build attendee_id -> event_id map from attendees
  const { data: attIdRows } = await sb.from("attendees").select("id, event_id");
  const attEventMap: Record<string, string> = {};
  for (const a of attIdRows ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = a as any;
    attEventMap[r.id] = r.event_id;
  }

  const regCounts: Record<string, number> = {};
  const checkedCounts: Record<string, number> = {};
  for (const a of attRows ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = a as any;
    regCounts[r.event_id] = (regCounts[r.event_id] ?? 0) + 1;
    if (r.checked_in_at) checkedCounts[r.event_id] = (checkedCounts[r.event_id] ?? 0) + 1;
  }

  const certCounts: Record<string, number> = {};
  for (const c of certRows ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = c as any;
    const eventId = attEventMap[r.attendee_id];
    if (eventId) certCounts[eventId] = (certCounts[eventId] ?? 0) + 1;
  }

  const totalReg = Object.values(regCounts).reduce((a, b) => a + b, 0);
  const totalChecked = Object.values(checkedCounts).reduce((a, b) => a + b, 0);
  const totalCerts = Object.values(certCounts).reduce((a, b) => a + b, 0);

  const rows = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.starts_at,
    organizer: e.organizer,
    status: e.status,
    registered: regCounts[e.id] ?? 0,
    checkedIn: checkedCounts[e.id] ?? 0,
    certs: certCounts[e.id] ?? 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Reports</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          Event reports
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">
          Per-event statistics with attendance rates and certificate delivery.
        </p>
      </div>

      <ReportsClient
        rows={rows}
        totals={{ events: events.length, registered: totalReg, checkedIn: totalChecked, certs: totalCerts }}
      />
    </div>
  );
}
