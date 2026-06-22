import { requireAdmin, listEvents } from "@/lib/admin/db";
import AttendanceClient from "./AttendanceClient";

export const metadata = { title: "Attendance" };

export default async function Attendance() {
  const { sb } = await requireAdmin();
  const events = await listEvents(sb);

  // Fetch all attendees with check-in info
  const { data: attendeesRaw } = await sb
    .from("attendees")
    .select("id, full_name, email, audience, uni_id, checked_in_at, registered_at, event_id")
    .order("registered_at", { ascending: true });

  // Group attendees by event
  const byEvent: Record<
    string,
    { id: string; full_name: string; email: string | null; audience: string | null; uni_id: string | null; checked_in_at: string | null; registered_at: string }[]
  > = {};

  for (const a of attendeesRaw ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = a as any;
    if (!byEvent[r.event_id]) byEvent[r.event_id] = [];
    byEvent[r.event_id].push({
      id: r.id,
      full_name: r.full_name,
      email: r.email ?? null,
      audience: r.audience ?? null,
      uni_id: r.uni_id ?? null,
      checked_in_at: r.checked_in_at ?? null,
      registered_at: r.registered_at,
    });
  }

  const eventRows = events.map((e) => ({
    id: e.id,
    title: e.title,
    starts_at: e.starts_at,
    organizer: e.organizer,
    attendees: byEvent[e.id] ?? [],
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Attendance</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          Registrations
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">
          Expand any event to see its full attendee list, toggle check-in status, and export to CSV.
        </p>
      </div>

      <AttendanceClient events={eventRows} />
    </div>
  );
}
