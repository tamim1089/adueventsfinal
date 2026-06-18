"use client";

import Link from "next/link";
import { LayoutDashboard, PencilLine } from "lucide-react";
import { useIsOrganizer } from "@/lib/useViewer";

// Subtle, fixed organizer toolbar on public pages — appears only when an
// organizer is signed in. Not shown to the public.
export default function OrganizerBar() {
  const isOrganizer = useIsOrganizer();
  if (!isOrganizer) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)]/95 px-2 py-2 shadow-[0_8px_30px_-8px_rgba(16,12,10,0.35)] backdrop-blur">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--accent)" }} />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
        </span>
        Organizer mode
      </span>
      <Link href="/admin" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.97]" style={{ background: "var(--accent)" }}>
        <LayoutDashboard size={13} /> Dashboard
      </Link>
      <Link href="/admin/events" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]">
        <PencilLine size={13} /> Manage events
      </Link>
    </div>
  );
}
