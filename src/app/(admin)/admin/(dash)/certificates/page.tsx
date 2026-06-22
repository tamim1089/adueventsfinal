import { requireAdmin } from "@/lib/admin/db";
import CertificatesClient from "./CertificatesClient";

export const metadata = { title: "Certificates" };

export default async function Certificates() {
  const { sb } = await requireAdmin();

  // Fetch events with attendees + their cert status
  const { data: eventsRaw } = await sb
    .from("events")
    .select("id, title, starts_at")
    .order("starts_at", { ascending: false });

  // Fetch all attendees with cert info
  const { data: attendeesRaw } = await sb
    .from("attendees")
    .select("id, full_name, email, event_id");

  // Fetch sent certs
  const { data: certsRaw } = await sb
    .from("certificates")
    .select("attendee_id, sent_at");

  const certMap: Record<string, string> = {};
  for (const c of certsRaw ?? []) {
    if (c.attendee_id && c.sent_at) certMap[c.attendee_id as string] = c.sent_at as string;
  }

  const attendeesByEvent: Record<string, { id: string; full_name: string; email: string | null; cert_sent_at: string | null }[]> = {};
  for (const a of attendeesRaw ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = a as any;
    if (!attendeesByEvent[r.event_id]) attendeesByEvent[r.event_id] = [];
    attendeesByEvent[r.event_id].push({
      id: r.id,
      full_name: r.full_name,
      email: r.email ?? null,
      cert_sent_at: certMap[r.id] ?? null,
    });
  }

  const totalSent = Object.values(certMap).length;

  const events = (eventsRaw ?? []).map((e) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    id: (e as any).id as string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    title: (e as any).title as string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    date: (e as any).starts_at as string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attendees: attendeesByEvent[(e as any).id] ?? [],
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Certificates</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          Issue &amp; send
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">
          Select attendees per event, then click <strong>Open Outlook</strong> to compose an email with all selected
          recipients pre-filled. {totalSent > 0 && <span>{totalSent} certificates marked as sent so far.</span>}
        </p>
      </div>

      <CertificatesClient events={events} />
    </div>
  );
}
