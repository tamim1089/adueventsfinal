#!/usr/bin/env bash
# Run from: /home/hex/adu-apps/al-ain-events
set -e

echo "▶ 1/3  Loading screen — dark bg + SpaceBackground blue particles, static logo..."
mkdir -p src/components/ui

cat > src/components/ui/space-background.tsx << 'EOF'
"use client"

import { useEffect, useRef } from "react"

interface Particle {
  color: string
  radius: number
  x: number
  y: number
  ring: number
  move: number
  random: number
}

export function SpaceBackground({
  particleCount = 450,
  particleColor = "rgba(99,102,241,0.85)",
  backgroundColor = "transparent",
  className = "",
}: {
  particleCount?: number
  particleColor?: string
  backgroundColor?: string
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animRef   = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let ratio = window.innerHeight < 400 ? 0.6 : 1
    const state = { particles: [] as Particle[], r: 120, counter: 0 }

    const setup = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      ctx.setTransform(ratio, 0, 0, -ratio, canvas.width / 2, canvas.height / 2)
    }
    setup()

    for (let i = 0; i < particleCount; i++) {
      state.particles.push({
        color:  particleColor,
        radius: Math.random() * 5,
        x: Math.cos(Math.random() * 7 + Math.PI) * state.r,
        y: Math.sin(Math.random() * 7 + Math.PI) * state.r,
        ring:   Math.random() * state.r * 3,
        move:   (Math.random() * 4 + 1) / 500,
        random: Math.random() * 7,
      })
    }

    const loop = () => {
      ctx.clearRect(-canvas.width, -canvas.height, canvas.width * 2, canvas.height * 2)
      if (state.counter < state.particles.length) state.counter++
      for (let i = 0; i < state.counter; i++) {
        const p = state.particles[i]
        if (p.radius < 0.8) { p.ring = Math.random() * state.r * 3; p.radius = Math.random() * 5 }
        p.radius *= 0.994
        p.ring = Math.max(p.ring - 1, state.r)
        p.random += p.move
        p.x = Math.cos(p.random + Math.PI) * p.ring
        p.y = Math.sin(p.random + Math.PI) * p.ring
        ctx.beginPath()
        ctx.fillStyle = p.color
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    const onResize = () => { ratio = window.innerHeight < 400 ? 0.6 : 1; setup() }
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [particleCount, particleColor])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute", top: 0, left: 0,
        display: "block", width: "100%", height: "100%",
        background: backgroundColor, pointerEvents: "none",
      }}
    />
  )
}
EOF

cat > src/components/ui/loading-screen.tsx << 'EOF'
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SpaceBackground } from "./space-background";

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fading,  setFading]  = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true),  2500);
    const t2 = setTimeout(() => setVisible(false), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#080c18",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      transition: "opacity 0.7s ease",
      opacity: fading ? 0 : 1,
      pointerEvents: fading ? "none" : "all",
      overflow: "hidden",
    }}>
      {/* Blue particle galaxy — exactly like the SpaceBackground demo */}
      <SpaceBackground
        particleCount={450}
        particleColor="rgba(99,102,241,0.85)"
        backgroundColor="transparent"
      />

      {/* Logo — static, above particles */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 20,
      }}>
        <Image
          src="/brand/ADU_Logo.png"
          alt="Abu Dhabi University"
          width={110} height={110}
          priority
          style={{ objectFit: "contain", width: 110, height: "auto" }}
        />
        <p style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 11,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontFamily: "system-ui, sans-serif",
          margin: 0,
        }}>
          Abu Dhabi University
        </p>
      </div>
    </div>
  );
}
EOF

echo "▶ 2/3  Fix GlassNav logo — chip only on dark hero, bare logo on light (scrolled)..."
cat > src/components/glass/GlassNav.tsx << 'EOF'
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
EOF

echo "▶ 3/3  Wire LoadingScreen into root layout..."
cat > src/app/layout.tsx << 'EOF'
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import MotionProvider from "@/components/MotionProvider";
import { LoadingScreen } from "@/components/ui/loading-screen";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ADU Events — Abu Dhabi University",
    template: "%s · ADU Events",
  },
  description:
    "Discover, organize, and document events across ADU — colleges, departments, and centers, all in one place.",
};

export const viewport: Viewport = {
  themeColor: "#f7f8fb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LoadingScreen />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
EOF

# Copy logo if available
[ -f "$HOME/Downloads/ADU_Logo.png" ] && cp "$HOME/Downloads/ADU_Logo.png" public/brand/ADU_Logo.png && echo "✓ Copied ADU_Logo.png"

echo ""
echo "✅  Done!"
echo "   1. Loading screen: dark (#080c18) + blue SpaceBackground particles + static logo"
echo "   2. Nav logo: white chip on dark hero → bare logo on light scrolled page"  
echo "   3. Layout: LoadingScreen wired in"
echo ""
echo "Run: npm run dev"
