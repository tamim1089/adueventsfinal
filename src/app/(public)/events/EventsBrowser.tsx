"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, CalendarDays, Users, X, ExternalLink, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassFilter } from "@/components/ui/liquid-radio";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Reveal from "@/components/landing/Reveal";
import { EVENTS_DATA, type EventItem } from "@/lib/events-data";

// ──────────────────────────────────────────
// Mobile bottom-sheet (Apple-style)
// ──────────────────────────────────────────
function EventSheet({
  event,
  onClose,
}: {
  event: EventItem;
  onClose: () => void;
}) {
  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "" };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-50 bg-black/50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        key="sheet"
        className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden"
        style={{
          borderRadius: "24px 24px 0 0",
          background: "var(--bg-elevated)",
          maxHeight: "90dvh",
          overflowY: "auto",
          paddingBottom: "env(safe-area-inset-bottom, 24px)",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--glass-border)]" />
        </div>

        {/* Hero image */}
        <div className="relative h-52 w-full overflow-hidden">
          <Image src={event.image} alt={event.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <span className="inline-block rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
            {event.organizer}
          </span>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] leading-tight">
            {event.title}
          </h2>

          {/* Meta */}
          <div className="space-y-2.5">
            {[
              { icon: CalendarDays, value: event.when      },
              { icon: MapPin,       value: event.venue     },
              { icon: Users,        value: `${event.attending.toLocaleString()} attending` },
            ].map(({ icon: Icon, value }) => (
              <div key={value} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <Icon size={16} className="shrink-0 text-[var(--accent)]" />
                {value}
              </div>
            ))}
          </div>

          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{event.overview}</p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 rounded-full py-3.5 text-sm font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              Register
            </button>
            <Link
              href={`/events/${event.slug}`}
              className="flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)]"
            >
              Full page <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────
// Card (shared — mobile opens sheet, desktop opens new page)
// ──────────────────────────────────────────
function EventCard({
  event,
  isMobile,
  onMobileOpen,
}: {
  event: EventItem;
  isMobile: boolean;
  onMobileOpen: (e: EventItem) => void;
}) {
  const inner = (
    <div className="group relative w-full overflow-hidden rounded-[24px] border border-[var(--glass-border)] bg-[var(--bg-elevated)] shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full flex flex-col">
      <div className="relative h-52 w-full overflow-hidden">
        <Image
          src={event.image} alt={event.title}
          fill className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <span className="absolute bottom-3 left-4 inline-block rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {event.organizer}
        </span>
      </div>
      <div className="flex flex-col flex-1 p-5 gap-2">
        <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] leading-snug">
          {event.title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 flex-1">{event.overview}</p>
        <div className="flex items-center justify-between pt-2 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <CalendarDays size={12} />{event.when}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={12} />{event.venue}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)]">
          View details <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <button className="w-full text-left h-full" onClick={() => onMobileOpen(event)}>
        {inner}
      </button>
    );
  }
  return <Link href={`/events/${event.slug}`} className="h-full block">{inner}</Link>;
}

// ──────────────────────────────────────────
// Featured wide card
// ──────────────────────────────────────────
function FeaturedCard({
  event,
  isMobile,
  onMobileOpen,
}: {
  event: EventItem;
  isMobile: boolean;
  onMobileOpen: (e: EventItem) => void;
}) {
  const inner = (
    <div className="group relative w-full overflow-hidden rounded-[28px] border border-[var(--glass-border)] bg-[var(--bg-elevated)] shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col md:flex-row">
      <div className="relative h-60 md:h-auto md:w-2/5 shrink-0 overflow-hidden">
        <Image
          src={event.image} alt={event.title}
          fill className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 hidden md:block" />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8 gap-3 flex-1">
        <span className="inline-block w-fit rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
          {event.organizer} · Featured
        </span>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight">
          {event.title}
        </h2>
        <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed line-clamp-2">
          {event.overview}
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1.5"><CalendarDays size={14} />{event.when}</span>
          <span className="flex items-center gap-1.5"><MapPin size={14} />{event.venue}</span>
          <span className="flex items-center gap-1.5"><Users size={14} />{event.attending.toLocaleString()} attending</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] mt-1">
          View full details <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <button className="w-full text-left" onClick={() => onMobileOpen(event)}>
        {inner}
      </button>
    );
  }
  return <Link href={`/events/${event.slug}`} className="block">{inner}</Link>;
}

// ──────────────────────────────────────────
// Main Browser
// ──────────────────────────────────────────
export default function EventsBrowser() {
  const [tab, setTab]             = useState<"upcoming" | "past">("upcoming");
  const [sheetEvent, setSheetEvent] = useState<EventItem | null>(null);
  const [isMobile, setIsMobile]   = useState(false);
  const list     = EVENTS_DATA[tab];
  const featured = list[0];

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-28 sm:pt-32 pb-24 w-full">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Events
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold text-[var(--text-primary)]">
            What&apos;s on at ADU
          </h1>
        </div>

        {/* Tab toggle */}
        <div className="inline-flex h-10 rounded-xl bg-[var(--bg-subtle)] p-0.5">
          <RadioGroup
            value={tab}
            onValueChange={(v) => setTab(v as "upcoming" | "past")}
            className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium
              after:absolute after:inset-y-0 after:w-1/2 after:rounded-[10px] after:bg-[var(--bg-elevated)]
              after:shadow-[0_1px_3px_rgba(0,0,0,0.12)] after:transition-transform after:duration-300
              after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
              data-[state=upcoming]:after:translate-x-0 data-[state=past]:after:translate-x-full"
            data-state={tab}
          >
            <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden rounded-xl" style={{ filter: 'url("#radio-glass")' }} />
            <label className="relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap px-5 transition-colors group-data-[state=upcoming]:text-[var(--text-primary)] group-data-[state=past]:text-[var(--text-tertiary)]">
              Upcoming
              <RadioGroupItem id="ev-upcoming" value="upcoming" className="sr-only" />
            </label>
            <label className="relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap px-5 transition-colors group-data-[state=past]:text-[var(--text-primary)] group-data-[state=upcoming]:text-[var(--text-tertiary)]">
              Past
              <RadioGroupItem id="ev-past" value="past" className="sr-only" />
            </label>
            <GlassFilter />
          </RadioGroup>
        </div>
      </div>

      {/* Featured */}
      <Reveal className="mb-6">
        <FeaturedCard
          event={featured}
          isMobile={isMobile}
          onMobileOpen={setSheetEvent}
        />
      </Reveal>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.slice(1).map((e, i) => (
          <Reveal key={e.slug} delay={i * 80} className="h-full">
            <EventCard
              event={e}
              isMobile={isMobile}
              onMobileOpen={setSheetEvent}
            />
          </Reveal>
        ))}
      </div>

      {/* Mobile bottom sheet */}
      {sheetEvent && (
        <EventSheet event={sheetEvent} onClose={() => setSheetEvent(null)} />
      )}
    </div>
  );
}
