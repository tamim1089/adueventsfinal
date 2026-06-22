"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Activity, CalendarDays, CalendarRange, Users, BadgeCheck, ClipboardList,
  Images, FileBarChart, Bell, Search, LogOut, Plus, Menu, X, type LucideIcon,
} from "lucide-react";
import { signOut } from "@/app/(admin)/admin/actions";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin",              label: "Overview",     icon: Activity },
  { href: "/admin/events",       label: "Events",       icon: CalendarDays },
  { href: "/admin/calendar",     label: "Calendar",     icon: CalendarRange },
  { href: "/admin/attendance",   label: "Attendance",   icon: Users },
  { href: "/admin/certificates", label: "Certificates", icon: BadgeCheck },
  { href: "/admin/surveys",      label: "Surveys",      icon: ClipboardList },
  { href: "/admin/photos",       label: "Photos",       icon: Images },
  { href: "/admin/reports",      label: "Reports",      icon: FileBarChart },
];

function NavLinks({ pathname, onNav }: { pathname: string; onNav?: () => void }) {
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      <p className="mb-3 px-3 text-xs font-medium text-[var(--text-tertiary)]">Navigation</p>
      {NAV.map((n) => {
        const Icon = n.icon;
        const active = isActive(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNav}
            className={`flex items-center gap-3 border-l-2 px-3.5 py-2.5 text-sm transition-colors ${
              active
                ? "border-l-[var(--accent)] font-medium text-[var(--text-primary)]"
                : "border-l-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon size={16} className={active ? "text-[var(--accent)]" : ""} />
            {n.label}
          </Link>
        );
      })}
      <Link
        href="/admin/events/new"
        onClick={onNav}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--accent-on)]"
        style={{ background: "var(--accent)" }}
      >
        <Plus size={16} /> New event
      </Link>
    </>
  );
}

export default function AdminShell({
  email,
  notifications,
  children,
}: {
  email: string;
  notifications: { title: string; when: string }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [bell, setBell] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const initial = (email[0] || "A").toUpperCase();

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);
  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">

      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-[var(--glass-border)] bg-[var(--bg-base)] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {/* hamburger — visible on < lg */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="text-sm font-medium text-[var(--accent)]">← ADU Events</Link>
          <span className="text-[var(--glass-border)]">|</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Dashboard</span>
        </div>

        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => { e.preventDefault(); router.push(`/admin/events?q=${encodeURIComponent(q)}`); }}
            className="hidden items-center gap-2 rounded-full border border-[var(--glass-border)] px-4 py-2 md:flex"
          >
            <Search size={14} className="text-[var(--text-tertiary)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events…"
              className="w-40 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </form>

          {/* bell */}
          <div className="relative">
            <button
              onClick={() => setBell((v) => !v)}
              className="relative grid h-9 w-9 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
              )}
            </button>
            {bell && (
              <div className="absolute right-0 top-11 z-50 w-72 border border-[var(--glass-border)] bg-[var(--bg-base)] p-2 shadow-lg" style={{ borderRadius: "var(--r-xl)" }}>
                <p className="px-2 py-1.5 text-xs font-medium text-[var(--text-tertiary)]">Upcoming</p>
                {notifications.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-[var(--text-secondary)]">Nothing scheduled.</p>
                ) : (
                  notifications.map((n, i) => (
                    <Link key={i} href="/admin/events" onClick={() => setBell(false)} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm hover:bg-[var(--bg-subtle)]">
                      <span className="truncate text-[var(--text-primary)]">{n.title}</span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--text-tertiary)]">{n.when}</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* user / sign out */}
          <form action={signOut}>
            <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]" title={email}>
              <span className="grid h-8 w-8 place-items-center rounded-full text-sm font-bold text-white" style={{ background: "var(--accent)" }}>{initial}</span>
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </header>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── MOBILE DRAWER ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-0.5 overflow-y-auto border-r border-[var(--glass-border)] bg-[var(--bg-base)] p-4 pt-5 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <NavLinks pathname={pathname} onNav={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex">
        {/* ── DESKTOP SIDEBAR (always visible on lg+) ── */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-60 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-[var(--glass-border)] p-4 lg:flex">
          <NavLinks pathname={pathname} />
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
