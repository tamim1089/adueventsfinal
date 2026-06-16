"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarDays, Handshake, Users, Sparkles, GraduationCap, type LucideIcon } from "lucide-react";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/empowered-ed-series", label: "Empowered Ed Series", icon: GraduationCap },
  { href: "/partnerships", label: "Partnerships & MoUs", icon: Handshake },
  { href: "/#organizers", label: "Organizers", icon: Users },
  { href: "/#features", label: "Features", icon: Sparkles },
];

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

/**
 * Full-width nav with a hairline bottom rule — not a floating centered glass pill.
 * Transparent (white text) over the dark hero; solid warm paper with a hairline
 * once the page scrolls or when we're not on the home route.
 */
export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const solid = scrolled || pathname !== "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const text = solid ? "text-[var(--text-primary)]" : "text-white";
  const subText = solid ? "text-[var(--text-secondary)]" : "text-white/85";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid
          ? "border-b border-[var(--glass-border)] bg-[var(--bg-base)]/95 backdrop-blur-[2px]"
          : "border-b border-transparent"
      }`}
    >
      <nav
        className={`flex h-[4.75rem] w-full items-center justify-between gap-6 ${EDGE}`}
        aria-label="Primary"
      >
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            className={
              solid
                ? ""
                : "inline-flex items-center justify-center rounded-md bg-white px-2 py-1.5"
            }
          >
            <Image
              src="/brand/ADU_Logo.png"
              alt="Abu Dhabi University"
              width={36}
              height={26}
              priority
              className="transition-transform duration-300 group-hover:scale-105"
              style={{ height: 26, width: "auto", objectFit: "contain" }}
            />
          </span>
          <span className={`text-base font-semibold tracking-tight ${text}`}>ADU Events</span>
        </Link>

        {/* desktop links — icon + label, lift + underline + icon pop on hover */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <a
                key={l.href}
                href={l.href}
                className={`group relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[1.05rem] font-medium transition-all duration-300 hover:-translate-y-0.5 hover:text-[var(--accent)] ${subText}`}
              >
                <Icon
                  size={17}
                  strokeWidth={2}
                  className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                />
                <span>{l.label}</span>
                <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-[var(--accent)] transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </a>
            );
          })}
          <Link
            href="/admin"
            className="ml-2 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[1.05rem] font-semibold text-[var(--accent-on)] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]"
            style={{ background: "var(--accent)" }}
          >
            Organizer sign in
          </Link>
        </div>

        {/* mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`grid h-11 w-11 place-items-center md:hidden ${text}`}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <span className="text-2xl leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </nav>

      {/* mobile sheet */}
      {open && (
        <div
          className={`flex flex-col gap-1 border-t border-[var(--glass-border)] bg-[var(--bg-base)] py-3 md:hidden ${EDGE}`}
        >
          {LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-2 py-3 text-base font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--accent)]"
              >
                <Icon size={19} strokeWidth={2} className="text-[var(--accent)]" />
                {l.label}
              </a>
            );
          })}
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="mt-1 rounded-full px-4 py-3 text-center text-base font-semibold text-[var(--accent-on)]"
            style={{ background: "var(--accent)" }}
          >
            Organizer sign in
          </Link>
        </div>
      )}
    </header>
  );
}
