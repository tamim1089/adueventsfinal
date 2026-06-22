"use client";

import { Download, CalendarDays, Users, CheckCircle2, BadgeCheck } from "lucide-react";

type ReportRow = {
  id: string;
  title: string;
  date: string;
  organizer: string;
  status: string;
  registered: number;
  checkedIn: number;
  certs: number;
};

type Totals = {
  events: number;
  registered: number;
  checkedIn: number;
  certs: number;
};

function exportCSV(rows: ReportRow[]) {
  const header = ["Event", "Date", "Organizer", "Status", "Registered", "Checked In", "Certs Sent", "Attendance %"];
  const data = rows.map((r) => [
    r.title,
    new Date(r.date).toLocaleDateString("en-AE"),
    r.organizer,
    r.status,
    r.registered,
    r.checkedIn,
    r.certs,
    r.registered ? `${Math.round((r.checkedIn / r.registered) * 100)}%` : "0%",
  ]);
  const csv = [header, ...data].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "adu_events_report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const maxBar = (rows: ReportRow[]) => Math.max(...rows.map((r) => r.registered), 1);

export default function ReportsClient({ rows, totals }: { rows: ReportRow[]; totals: Totals }) {
  const max = maxBar(rows);

  const KPIS = [
    { icon: CalendarDays, value: totals.events, label: "Total events" },
    { icon: Users, value: totals.registered, label: "Registrations" },
    { icon: CheckCircle2, value: totals.checkedIn, label: "Checked in" },
    { icon: BadgeCheck, value: totals.certs, label: "Certs sent" },
  ];

  return (
    <div className="space-y-8">
      {/* KPI grid */}
      <div
        className="grid grid-cols-2 gap-px border border-[var(--glass-border)] bg-[var(--glass-border)] lg:grid-cols-4"
        style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}
      >
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="flex flex-col gap-3 bg-[var(--bg-base)] p-6">
              <Icon size={18} strokeWidth={1.75} className="text-[var(--accent)]" />
              <p className="font-mono text-4xl font-semibold tabular-nums text-[var(--text-primary)]">{k.value}</p>
              <p className="text-xs font-medium text-[var(--text-tertiary)]">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Bar chart — attendance rate per event */}
      {rows.length > 0 && (
        <div
          className="overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-6"
        >
          <h2 className="mb-5 text-sm font-medium text-[var(--text-tertiary)]">Registrations per event</h2>
          <div className="space-y-3">
            {rows.map((r) => {
              const pct = Math.round((r.registered / max) * 100);
              const attendRate = r.registered ? Math.round((r.checkedIn / r.registered) * 100) : 0;
              return (
                <div key={r.id} className="group">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium text-[var(--text-primary)]">{r.title}</p>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                      {r.registered} reg · {attendRate}% attended
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                      {/* Registered bar */}
                      <div className="relative h-full" style={{ width: `${pct}%` }}>
                        <div className="h-full w-full rounded-full" style={{ background: "var(--accent)", opacity: 0.3 }} />
                        {/* Checked-in overlay */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: r.registered ? `${(r.checkedIn / r.registered) * 100}%` : "0%",
                            background: "var(--accent)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-full" style={{ background: "var(--accent)", opacity: 0.3 }} />
              Registered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-full" style={{ background: "var(--accent)" }} />
              Checked in
            </span>
          </div>
        </div>
      )}

      {/* Data table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--text-tertiary)]">Full breakdown</h2>
          <button
            onClick={() => exportCSV(rows)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-subtle)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
        <div
          className="overflow-hidden border border-[var(--glass-border)]"
          style={{ borderRadius: "var(--r-xl)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-subtle)] text-left text-xs font-medium text-[var(--text-tertiary)]">
                  <th className="px-4 py-3">Event</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-right">Registered</th>
                  <th className="px-4 py-3 text-right">Checked in</th>
                  <th className="hidden px-4 py-3 text-right md:table-cell">Certs</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const rate = r.registered ? Math.round((r.checkedIn / r.registered) * 100) : 0;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-[var(--glass-border)] last:border-0 hover:bg-[var(--bg-subtle)]"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--text-primary)]">{r.title}</p>
                        <p className="text-xs capitalize text-[var(--text-tertiary)]">{r.organizer}</p>
                      </td>
                      <td className="hidden px-4 py-3 font-mono text-xs tabular-nums text-[var(--text-secondary)] sm:table-cell">
                        {new Date(r.date).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--text-primary)]">
                        {r.registered}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-400">
                        {r.checkedIn}
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono tabular-nums text-[var(--text-secondary)] md:table-cell">
                        {r.certs}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs tabular-nums font-semibold"
                          style={{
                            background: rate >= 75 ? "rgba(52,211,153,0.12)" : rate >= 40 ? "rgba(251,191,36,0.12)" : "var(--bg-subtle)",
                            color: rate >= 75 ? "#34d399" : rate >= 40 ? "#fbbf24" : "var(--text-tertiary)",
                          }}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
