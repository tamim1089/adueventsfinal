import { Lock, Clock, MapPin, Radio, CalendarDays, BadgeCheck, Users } from "lucide-react";

const P = "/media/photos";

const KPIS = [
  { icon: CalendarDays, value: "6", label: "Today" },
  { icon: Radio, value: "2", label: "Live now" },
  { icon: Users, value: "1.2k", label: "Attending" },
  { icon: BadgeCheck, value: "240", label: "Certificates" },
];

const ROWS = [
  { title: "Founders & Funding Night", org: "Innovation Center", when: "6:00 PM", where: "Auditorium A", img: `${P}/MaleStudents_Together_On_a_Table_500x350-13.jpeg`, live: true },
  { title: "Robotics Showcase", org: "College of Engineering", when: "6:30 PM", where: "Lab Building 2", img: `${P}/Student_Working_on_Machinecoe-landing2.jpg`, live: true },
  { title: "Research Skills Workshop", org: "Library", when: "Tomorrow · 11:00 AM", where: "Learning Commons", img: `${P}/TwoFemaleStudentsonatable_500x350-14.jpeg`, live: false },
];

const NAV = ["Overview", "Events", "Attendance", "Certificates", "Reports"];

// A live, real mini-app rendered inside the scroll "screen" — crisp DOM, not a
// flat image. Shows what the dashboard actually does: live events, KPIs, actions.
export default function ShowcaseScreen() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white text-left">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="mx-auto flex items-center gap-1.5 rounded-full bg-white px-4 py-1 text-[11px] text-[var(--text-tertiary)] shadow-sm">
          <Lock size={11} /> events.adu.ac.ae
        </div>
      </div>

      {/* body */}
      <div className="grid flex-1 grid-cols-12 gap-4 overflow-hidden p-4 md:p-6">
        {/* sidebar */}
        <aside className="hidden flex-col gap-1.5 md:col-span-3 md:flex">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg text-sm font-bold text-white" style={{ background: "var(--accent)" }}>A</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">ADU Events</span>
          </div>
          {NAV.map((n, i) => (
            <span key={n}
              className={`rounded-lg px-3 py-2 text-sm ${i === 1 ? "font-semibold text-white" : "text-[var(--text-secondary)]"}`}
              style={i === 1 ? { background: "var(--accent)" } : undefined}>
              {n}
            </span>
          ))}
        </aside>

        {/* main */}
        <main className="col-span-12 flex flex-col gap-4 overflow-hidden md:col-span-9">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-[var(--text-primary)] md:text-2xl">Happening now</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "var(--accent)" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
              </span>
              2 live
            </span>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2.5">
            {KPIS.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="rounded-xl border border-[var(--glass-border)] bg-white p-3 shadow-sm">
                  <Icon size={16} style={{ color: "var(--accent)" }} />
                  <p className="mt-2 font-display text-xl font-bold text-[var(--text-primary)]">{k.value}</p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">{k.label}</p>
                </div>
              );
            })}
          </div>

          {/* event rows */}
          <div className="flex flex-col gap-2.5 overflow-hidden">
            {ROWS.map((r) => (
              <div key={r.title} className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-white p-2.5 shadow-sm transition-transform hover:-translate-y-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.img} alt="" className="h-14 w-20 flex-shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs text-[var(--text-tertiary)]">{r.org}</span>
                    {r.live && (
                      <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}>
                        <Radio size={9} /> Live
                      </span>
                    )}
                  </div>
                  <p className="truncate font-display text-base font-semibold text-[var(--text-primary)]">{r.title}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1"><Clock size={12} /> {r.when}</span>
                    <span className="inline-flex items-center gap-1"><MapPin size={12} /> {r.where}</span>
                  </div>
                </div>
                <span className="hidden flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white sm:inline" style={{ background: "var(--accent)" }}>
                  Manage
                </span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
