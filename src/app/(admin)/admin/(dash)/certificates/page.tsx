import { requireAdmin, listEvents } from "@/lib/admin/db";

export const metadata = { title: "Certificates" };

export default async function Certificates() {
  const { sb } = await requireAdmin();
  const events = await listEvents(sb);
  const { count } = await sb.from("certificates").select("id", { count: "exact", head: true });
  const { data: att } = await sb.from("attendees").select("event_id");
  const reg: Record<string, number> = {};
  for (const r of att ?? []) reg[r.event_id as string] = (reg[r.event_id as string] ?? 0) + 1;
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Certificates</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">Issue & send</h1>
        <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">
          Registration no longer downloads a certificate. After an event ends, send certificates to every
          registrant by email from here. ({count ?? 0} issued so far.)
        </p>
      </div>
      <div className="overflow-hidden border border-[var(--glass-border)]" style={{ borderRadius: "var(--r-xl)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-subtle)] text-left text-xs font-medium text-[var(--text-tertiary)]">
              <th className="px-4 py-3">Event</th><th className="px-4 py-3 text-right">Registered</th><th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const ended = new Date(e.ends_at).getTime() < now;
              return (
                <tr key={e.id} className="border-b border-[var(--glass-border)] last:border-0">
                  <td className="px-4 py-3"><p className="font-semibold text-[var(--text-primary)]">{e.title}</p><p className="text-xs text-[var(--text-tertiary)]">{ended ? "Ended" : "Not yet ended"}</p></td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--text-primary)]">{reg[e.id] ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled
                      title="Add RESEND_API_KEY to enable emailing"
                      className="cursor-not-allowed rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text-tertiary)] opacity-60"
                      style={{ background: "var(--bg-subtle)" }}
                    >
                      Send certificates
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">Emailing turns on once you add <code className="rounded bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono text-xs">RESEND_API_KEY</code> and paste it to me.</p>
    </div>
  );
}
