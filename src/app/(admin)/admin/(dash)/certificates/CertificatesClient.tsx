"use client";

import { useState, useTransition } from "react";
import { Mail, CheckCircle2, Circle, ChevronDown, ChevronUp, Send, Loader2 } from "lucide-react";
import { sendCertificates } from "./cert-actions";

type Attendee = {
  id: string;
  full_name: string;
  email: string | null;
  cert_sent_at: string | null;
};

type EventGroup = {
  id: string;
  title: string;
  date: string;
  attendees: Attendee[];
};

export default function CertificatesClient({ events }: { events: EventGroup[] }) {
  // selected: map of eventId -> Set of attendeeIds
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<Record<string, string>>({});

  function toggleExpand(eventId: string) {
    setExpanded((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
  }

  function getSelected(eventId: string): Set<string> {
    return selected[eventId] ?? new Set();
  }

  function toggleAttendee(eventId: string, attendeeId: string) {
    setSelected((prev) => {
      const s = new Set(prev[eventId] ?? []);
      s.has(attendeeId) ? s.delete(attendeeId) : s.add(attendeeId);
      return { ...prev, [eventId]: s };
    });
  }

  function toggleAll(eventId: string, attendees: Attendee[]) {
    const s = getSelected(eventId);
    const allIds = attendees.filter((a) => a.email).map((a) => a.id);
    if (s.size === allIds.length) {
      setSelected((prev) => ({ ...prev, [eventId]: new Set() }));
    } else {
      setSelected((prev) => ({ ...prev, [eventId]: new Set(allIds) }));
    }
  }

  function sendViaGraph(eventId: string, eventTitle: string, attendees: Attendee[]) {
    const s = getSelected(eventId);
    if (!s.size) return;
    const recipients = attendees
      .filter((a) => s.has(a.id) && a.email)
      .map((a) => ({ id: a.id, full_name: a.full_name, email: a.email! }));

    startTransition(async () => {
      const res = await sendCertificates(recipients, eventTitle);
      if (res.ok) {
        const msg = `Sent ${res.sent ?? recipients.length} certificate${(res.sent ?? recipients.length) > 1 ? "s" : ""} ✓`;
        setFlash((prev) => ({ ...prev, [eventId]: res.error ? `${msg} (DB warning)` : msg }));
        setSelected((prev) => ({ ...prev, [eventId]: new Set() }));
        setTimeout(() => setFlash((prev) => { const n = { ...prev }; delete n[eventId]; return n; }), 5000);
      } else if (res.needsLogin) {
        // Fallback: open mailto in batches
        const emails = recipients.map((r) => r.email);
        const subject = encodeURIComponent(`Your Certificate — ${eventTitle}`);
        const body = encodeURIComponent(
          `Dear attendee,\n\nThank you for participating in "${eventTitle}".\nPlease find your certificate of participation attached.\n\nBest regards,\nADU Events Team`
        );
        window.open(`mailto:${emails.join(";")}?subject=${subject}&body=${body}`, "_blank");
        setFlash((prev) => ({ ...prev, [eventId]: "No Microsoft session — Outlook opened as fallback" }));
        setTimeout(() => setFlash((prev) => { const n = { ...prev }; delete n[eventId]; return n; }), 6000);
      } else {
        setFlash((prev) => ({ ...prev, [eventId]: `Error: ${res.error ?? "Unknown error"}` }));
        setTimeout(() => setFlash((prev) => { const n = { ...prev }; delete n[eventId]; return n; }), 6000);
      }
    });
  }

  if (!events.length) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">No events yet. Events will appear here once created.</p>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((ev) => {
        const isOpen = expanded[ev.id] ?? false;
        const sel = getSelected(ev.id);
        const eligible = ev.attendees.filter((a) => a.email);
        const sentCount = ev.attendees.filter((a) => a.cert_sent_at).length;
        const allSelected = eligible.length > 0 && sel.size === eligible.length;

        return (
          <div
            key={ev.id}
            className="overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)]"
          >
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
              <button
                onClick={() => toggleExpand(ev.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                {isOpen ? (
                  <ChevronUp size={16} className="shrink-0 text-[var(--text-tertiary)]" />
                ) : (
                  <ChevronDown size={16} className="shrink-0 text-[var(--text-tertiary)]" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--text-primary)]">{ev.title}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {new Date(ev.date).toLocaleDateString("en-AE", { dateStyle: "medium" })} ·{" "}
                    {ev.attendees.length} registrants · {sentCount} certs sent
                  </p>
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-2">
                {flash[ev.id] && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 size={12} /> {flash[ev.id]}
                  </span>
                )}
                <button
                  onClick={() => sendViaGraph(ev.id, ev.title, ev.attendees)}
                  disabled={!sel.size || pending}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background: sel.size ? "var(--accent)" : "var(--bg-subtle)",
                    color: sel.size ? "var(--accent-on)" : "var(--text-tertiary)",
                  }}
                >
                  {pending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  {pending ? "Sending…" : sel.size ? `Send (${sel.size})` : "Send"}
                </button>
              </div>
            </div>

            {/* Attendee table */}
            {isOpen && (
              <div className="border-t border-[var(--glass-border)]">
                {ev.attendees.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-[var(--text-tertiary)]">No registrants for this event.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-subtle)] text-left text-xs font-medium text-[var(--text-tertiary)]">
                        <th className="px-4 py-3">
                          <button
                            onClick={() => toggleAll(ev.id, ev.attendees)}
                            className="flex items-center gap-2 font-medium"
                          >
                            {allSelected ? (
                              <CheckCircle2 size={14} className="text-[var(--accent)]" />
                            ) : (
                              <Circle size={14} />
                            )}
                            Name
                          </button>
                        </th>
                        <th className="hidden px-4 py-3 sm:table-cell">Email</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ev.attendees.map((a) => {
                        const isChecked = sel.has(a.id);
                        return (
                          <tr
                            key={a.id}
                            className="border-b border-[var(--glass-border)] last:border-0 transition-colors hover:bg-[var(--bg-subtle)]"
                          >
                            <td className="px-4 py-3">
                              <button
                                onClick={() => a.email && toggleAttendee(ev.id, a.id)}
                                disabled={!a.email}
                                className="flex items-center gap-2.5 text-left disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isChecked ? (
                                  <CheckCircle2 size={15} className="shrink-0 text-[var(--accent)]" />
                                ) : (
                                  <Circle size={15} className="shrink-0 text-[var(--text-tertiary)]" />
                                )}
                                <span className="font-medium text-[var(--text-primary)]">{a.full_name}</span>
                              </button>
                            </td>
                            <td className="hidden px-4 py-3 font-mono text-xs text-[var(--text-secondary)] sm:table-cell">
                              {a.email ?? <span className="italic text-[var(--text-tertiary)]">no email</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {a.cert_sent_at ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                                  <CheckCircle2 size={11} />
                                  Sent {new Date(a.cert_sent_at).toLocaleDateString("en-AE", { day: "numeric", month: "short" })}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                                  <Mail size={11} />
                                  Not sent
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
