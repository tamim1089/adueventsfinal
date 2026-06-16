"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CenterUnderline } from "@/components/ui/underline-animation";

const LINKS = [
  { href: "/events", label: "Events" },
  { href: "/partnerships", label: "Partnerships & MoUs" },
  { href: "/#organizers", label: "Organizers" },
  { href: "/#features", label: "Features" },
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
  const subText = solid ? "text-[var(--text-secondary)]" : "text-white/75";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid
          ? "border-b border-[var(--glass-border)] bg-[var(--bg-base)]/95 backdrop-blur-[2px]"
          : "border-b border-transparent"
      }`}
    >
      <nav
        className={`flex h-16 w-full items-center justify-between gap-6 ${EDGE}`}
        aria-label="Primary"
      >
        <Link href="/" className="flex items-center gap-2.5">
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
              width={32}
              height={22}
              priority
              style={{ height: 22, width: "auto", objectFit: "contain" }}
            />
          </span>
          <span className={`text-sm font-semibold tracking-tight ${text}`}>
            ADU Events
          </span>
        </Link>

        {/* desktop links */}
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-[0.8125rem] transition-colors hover:text-[var(--accent)] ${subText}`}
            >
              <CenterUnderline label={l.label} />
            </a>
          ))}
          <Link
            href="/admin"
            className="rounded-full px-4 py-2 text-[0.8125rem] font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.97]"
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
          <span className="text-xl leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </nav>

      {/* mobile sheet */}
      {open && (
        <div
          className={`flex flex-col gap-1 border-t border-[var(--glass-border)] bg-[var(--bg-base)] py-3 md:hidden ${EDGE}`}
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3 text-base text-[var(--text-primary)]"
            >
              {l.label}
            </a>
          ))}
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
