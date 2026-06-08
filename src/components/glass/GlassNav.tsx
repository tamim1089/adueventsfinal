"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/events",      label: "Events"     },
  { href: "/#organizers", label: "Organizers" },
  { href: "/#features",   label: "Features"   },
];

export default function GlassNav() {
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const textCls    = scrolled ? "text-[var(--text-primary)]"   : "text-white";
  const subTextCls = scrolled ? "text-[var(--text-secondary)]" : "text-white/70";

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <nav
        className={`flex w-full max-w-5xl items-center justify-between gap-4 rounded-[20px] px-4 py-3 transition-all duration-300 ${
          scrolled ? "glass" : "border border-white/10 bg-white/5 backdrop-blur-md"
        }`}
        aria-label="Primary"
      >
        <Link href="/" className="flex items-center gap-2.5">
          {scrolled ? (
            /* Light mode — logo has its own colors, render directly */
            <Image
              src="/brand/ADU_Logo.png"
              alt="Abu Dhabi University"
              width={32} height={24}
              priority
              style={{ height: 24, width: "auto", objectFit: "contain" }}
            />
          ) : (
            /* Dark hero — wrap in white chip so logo is legible */
            <span className="inline-flex items-center justify-center rounded-xl bg-white px-2.5 py-1.5 shadow-sm">
              <Image
                src="/brand/ADU_Logo.png"
                alt="Abu Dhabi University"
                width={32} height={22}
                priority
                style={{ height: 22, width: "auto", objectFit: "contain" }}
              />
            </span>
          )}
          <span className={`text-sm font-semibold tracking-tight ${textCls}`}>
            ADU Events
          </span>
        </Link>

        {/* desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href} href={l.href}
              className={`rounded-full px-3.5 py-2 text-sm transition-colors hover:text-[var(--accent)] ${subTextCls}`}
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/admin"
            className="ml-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--accent-on)] shadow-md transition-transform active:scale-[0.97]"
            style={{ background: "var(--accent)" }}
          >
            Organizer sign in
          </Link>
        </div>

        {/* mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`grid h-11 w-11 place-items-center rounded-full md:hidden ${textCls}`}
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
              key={l.href} href={l.href}
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
