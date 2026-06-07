"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "#events", label: "Events" },
  { href: "#organizers", label: "Organizers" },
  { href: "#features", label: "Features" },
];

// Floating glass nav — a pill inset from the top, not a full-width opaque bar.
// Solidifies slightly on scroll for legibility over light content.
export default function GlassNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <nav
        className={`glass flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 transition-colors duration-300 ${
          scrolled ? "!bg-[#0a0c16]/70" : ""
        }`}
        aria-label="Primary"
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="grid h-8 w-8 place-items-center rounded-[10px] font-display text-lg font-bold text-[var(--accent-on)]"
            style={{ background: "var(--accent)" }}
            aria-hidden="true"
          >
            A
          </span>
          <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            Al Ain Campus Events
          </span>
        </Link>

        {/* desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/admin"
            className="ml-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--accent-on)] shadow-lg transition-transform active:scale-[0.97]"
            style={{ background: "var(--accent)" }}
          >
            Organizer sign in
          </Link>
        </div>

        {/* mobile toggle — 44px target */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-11 w-11 place-items-center rounded-full text-[var(--text-primary)] md:hidden"
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <span className="text-xl leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </nav>

      {/* mobile sheet */}
      {open && (
        <div className="glass absolute inset-x-4 top-[calc(100%+0.5rem)] flex flex-col gap-1 p-3 md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-[14px] px-4 py-3 text-base text-[var(--text-primary)]"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/admin"
            className="mt-1 rounded-[14px] px-4 py-3 text-center text-base font-semibold text-[var(--accent-on)]"
            style={{ background: "var(--accent)" }}
          >
            Organizer sign in
          </Link>
        </div>
      )}
    </header>
  );
}
