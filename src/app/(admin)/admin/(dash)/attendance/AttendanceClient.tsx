"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Download, Users } from "lucide-react";
import { toggleCheckIn } from "./attendance-actions";

type Attendee = {
  id: string;
  full_name: string;
  email: string | null;
  audience: string | null;
  uni_id: string | null;
  checked_in_at: string | null;
  registered_at: string;
};

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
  organizer: string;
  attendees: Attendee[];
};

function exportCSV(title: string, attendees: Attendee[]) {
  const header = ["Name", "Email", "Audience", "Uni ID", "Registered", "Checked In"];
  const rows = attendees.map((a) => [
    a.full_name,
    a.email ?? "",
    a.audience ?? "",
    a.uni_id ?? "",
    new Date(a.registered_at).toLocaleString("en-AE"),
    a.checked_in_at ? new Date(a.checked_in_at).toLocaleString("en-AE") : "No",
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, "_")}_attendance.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AttendeeRow({ attendee, eventId }: { attendee: Attendee; eventId: string }) {
  const [checkedInAt, setCheckedInAt] = useState(attendee.checked_in_at);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const next = checkedInAt ? null : new Date().toISOString();
      const res = await toggleCheckIn(attendee.id, eventId, !checkedInAt);
      if (res.ok) setCheckedInAt(next);
    });
  }

  return (
    <tr className="border-b border-[var(--glass-border)] last:border-0 transition-colors hover:bg-[var(--bg-subtle)]">
      <td className="px-4 py-3">
        <p className="font-medium text-[var(--text-primary)]">{attendee.full_name}</p>
        {attendee.uni_id && (
          <p className="font-mono text-xs text-[var(--text-tertiary)]">{attendee.uni_id}</p>
        )}
      </td>
      <td className="hidden px-4 py-3 font-mono text-xs text-[var(--text-secondary)] sm:table-cell">
        {attendee.email ?? <span className="italic text-[var(--text-tertiary)]">—</span>}
      </td>
      <td className="hidden px-4 py-3 text-xs capitalize text-[var(--text-secondary)] md:table-cell">
        {attendee.audience ?? "—"}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={toggle}
          disabled={pending}
          className="flex items-center gap-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
        >
          {checkedInAt ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-emerald-400">
                {new Date(checkedInAt).toLocaleDateString("en-AE", { day: "numeric", month: "short" })}
              </span>
            </>
          ) : (
            <>
              <Circle size={14} className="text-[var(--text-tertiary)]" />
              <span className="text-[var(--text-tertiary)]">Not checked in</span>
            </>
          )}
        </button>
      </td>
    </tr>
  );
}

export default function AttendanceClient({ events }: { events: EventRow[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const totalReg = events.reduce((sum, e) => sum + e.attendees.length, 0);
  const totalChecked = events.reduce(
    (sum, e) => sum + e.attendees.filter((a) => a.checked_in_at).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-5">
        <div>
          <p className="font-mono text-3xl font-semibold tabular-nums text-[var(--text-primary)]">{totalReg}</p>
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Total registrations</p>
        </div>
        <div>
          <p className="font-mono text-3xl font-semibold tabular-nums text-emerald-400">{totalChecked}</p>
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Checked in</p>
        </div>
        <div>
          <p className="font-mono text-3xl font-semibold tabular-nums text-[var(--text-primary)]">
            {totalReg ? Math.round((totalChecked / totalReg) * 100) : 0}%
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Attendance rate</p>
        </div>
      </div>

      {/* Event accordion list */}
      <div className="space-y-3">
        {events.map((ev) => {
          const isOpen = expanded[ev.id] ?? false;
          const checkedIn = ev.attendees.filter((a) => a.checked_in_at).length;
          const pct = ev.attendees.length ? Math.round((checkedIn / ev.attendees.length) * 100) : 0;

          return (
            <div
              key={ev.id}
              className="overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)]"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
                <button
                  onClick={() => toggleExpand(ev.id)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  {isOpen ? (
                    <ChevronUp size={16} className="mt-1 shrink-0 text-[var(--text-tertiary)]" />
                  ) : (
                    <ChevronDown size={16} className="mt-1 shrink-0 text-[var(--text-tertiary)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--text-primary)]">{ev.title}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {ev.organizer} ·{" "}
                      {new Date(ev.starts_at).toLocaleDateString("en-AE", { dateStyle: "medium" })}
                    </p>
                    {/* Progress bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                        {checkedIn}/{ev.attendees.length} · {pct}%
                      </span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-[var(--bg-subtle)] px-3 py-1.5 font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                    <Users size={12} /> {ev.attendees.length}
                  </span>
                  <button
                    onClick={() => exportCSV(ev.title, ev.attendees)}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    <Download size={12} /> CSV
                  </button>
                </div>
              </div>

              {/* Attendee list */}
              {isOpen && (
                <div className="border-t border-[var(--glass-border)]">
                  {ev.attendees.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-[var(--text-tertiary)]">No registrants yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-subtle)] text-left text-xs font-medium text-[var(--text-tertiary)]">
                            <th className="px-4 py-3">Name</th>
                            <th className="hidden px-4 py-3 sm:table-cell">Email</th>
                            <th className="hidden px-4 py-3 md:table-cell">Audience</th>
                            <th className="px-4 py-3">Check-in</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ev.attendees.map((a) => (
                            <AttendeeRow key={a.id} attendee={a} eventId={ev.id} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
