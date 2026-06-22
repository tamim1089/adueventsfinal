"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, X, Clock,
  ChevronLeft, ChevronRight, PencilLine, ImagePlus,
} from "lucide-react";
import type { EventItem } from "@/lib/events-data";
import type { School } from "@/lib/schools-data";
import type { GalleryPhoto } from "@/lib/data";
import { useIsOrganizer } from "@/lib/useViewer";
import RegistrationSheet from "./RegistrationSheet";

type DetailEvent = EventItem & { id?: string; audience?: "uni" | "external"; bannerUrl?: string | null };

const EASE = [0.2, 0.8, 0.2, 1] as const;
const EDGE = "px-[clamp(1.25rem,5vw,5rem)]";

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

// Parse a formatted "when" string into day + month/year + time parts
function parseDateParts(when: string) {
  // e.g. "Jun 17, 2026" or "Today · 6:00 PM" or "Tomorrow · 11:00 AM"
  const timeMatch = when.match(/·\s*(.+)$/);
  const time = timeMatch ? timeMatch[1].trim() : "";

  if (when.startsWith("Today")) return { day: "Today", monthYear: "", time };
  if (when.startsWith("Tomorrow")) return { day: "Tmrw.", monthYear: "", time };

  // Try "Jun 17, 2026" or "Mon · …" patterns
  const dateOnly = when.replace(/·.*$/, "").trim();
  const parts = dateOnly.split(/[\s,]+/).filter(Boolean);

  // ["Jun", "17", "2026"] or ["Mon"]
  if (parts.length >= 2) {
    const day = parts[1] ? parts[1].padStart(2, "0") : parts[0];
    const monthYear = parts[2] ? `${parts[0]} ${parts[2]}` : parts[0];
    return { day, monthYear, time };
  }

  return { day: parts[0] ?? when, monthYear: "", time };
}

export default function EventDetail({
  event,
  related,
  schools,
  gallery = [],
}: {
  event: DetailEvent;
  related: DetailEvent[];
  schools: School[];
  gallery?: GalleryPhoto[];
}) {
  const reduce = useReducedMotion();
  const isOrganizer = useIsOrganizer();
  const [lightbox, setLightbox] = useState<number | null>(null);

  const { day, monthYear, time } = parseDateParts(event.when);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          HERO  — full-bleed, tall, bold
      ══════════════════════════════════════════════════════════ */}
      <section className="relative flex h-[clamp(500px,75vh,800px)] w-full flex-col justify-end overflow-hidden">
        <Image
          src={event.bannerUrl || event.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(8,6,4,0.25) 0%, rgba(8,6,4,0.05) 25%, rgba(8,6,4,0.96) 100%)" }}
        />

        {/* Back */}
        <Link
          href="/events"
          className={`absolute left-[clamp(1.25rem,5vw,5rem)] top-[4.75rem] inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15`}
        >
          <ArrowLeft size={14} /> All events
        </Link>

        {/* Admin controls */}
        {isOrganizer && event.id && (
          <div className="absolute right-[clamp(1.25rem,5vw,5rem)] top-[4.75rem] z-10 flex gap-2">
            <Link href={`/admin/events/${event.id}/edit`} className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/30 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/50">
              <PencilLine size={14} /> Edit
            </Link>
            <Link href={`/admin/events/${event.id}/edit`} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-[var(--accent-on)]" style={{ background: "var(--accent)" }}>
              <ImagePlus size={14} /> Add media
            </Link>
          </div>
        )}

        {/* Title block */}
        <div className={`relative z-10 pb-12 sm:pb-16 ${EDGE}`}>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
            {event.organizer}
          </p>
          <motion.h1
            className="max-w-5xl font-display text-[clamp(2.75rem,7.5vw,6rem)] font-bold leading-[0.94] tracking-[-0.035em] text-white"
            initial={reduce ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.06 }}
          >
            {event.title}
          </motion.h1>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STAT STRIP  — editorial / concert-poster style
          Three bold typographic columns separated by vertical rules.
          No boxes, no cards — pure typography on the page.
      ══════════════════════════════════════════════════════════ */}
      <motion.section
        className={`border-b border-[var(--glass-border)] bg-[var(--bg-base)] py-10 sm:py-14 ${EDGE}`}
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
      >
        {/* Three-column strip */}
        <div className="flex flex-col divide-y divide-[var(--glass-border)] sm:flex-row sm:divide-x sm:divide-y-0">

          {/* DATE */}
          <div className="flex flex-col justify-center gap-1 pb-8 sm:pb-0 sm:pr-12 md:pr-20">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Date</p>
            <div className="flex items-baseline gap-3 mt-1">
              <span
                className="font-display font-bold leading-none text-[var(--text-primary)]"
                style={{ fontSize: "clamp(3.5rem, 8vw, 6rem)" }}
              >
                {day}
              </span>
              {monthYear && (
                <span className="font-display text-[clamp(1.1rem,2.5vw,1.5rem)] font-semibold leading-tight text-[var(--text-secondary)]">
                  {monthYear}
                </span>
              )}
            </div>
            {time && (
              <p className="mt-1 text-[clamp(0.95rem,2vw,1.15rem)] font-medium text-[var(--text-secondary)]">
                {time}
              </p>
            )}
          </div>

          {/* VENUE */}
          <div className="flex flex-col justify-center gap-1 py-8 sm:py-0 sm:px-12 md:px-20">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Venue</p>
            <p
              className="mt-1 font-display font-bold leading-[1.05] text-[var(--text-primary)]"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.75rem)" }}
            >
              {event.venue}
            </p>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">Abu Dhabi University, Al Ain</p>
          </div>

          {/* ATTENDING + CTA */}
          <div className="flex flex-col justify-center gap-1 pt-8 sm:pt-0 sm:pl-12 md:pl-20 sm:ml-auto">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Attending</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className="font-display font-bold leading-none text-[var(--accent)]"
                style={{ fontSize: "clamp(3rem, 7vw, 5rem)" }}
              >
                {event.attending.toLocaleString()}
              </span>
              <span className="font-display text-[clamp(1rem,2vw,1.25rem)] font-semibold text-[var(--text-secondary)]">
                registered
              </span>
            </div>
            <div className="mt-4">
              {event.id ? (
                <RegistrationSheet
                  event={{ id: event.id, title: event.title, audience: event.audience ?? "uni" }}
                  schools={schools}
                />
              ) : null}
            </div>
          </div>

        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════
          ABOUT  — full-width reading column, generous type
      ══════════════════════════════════════════════════════════ */}
      <section className={`border-b border-[var(--glass-border)] bg-[var(--bg-base)] py-16 sm:py-24 ${EDGE}`}>
        <FadeUp className="max-w-4xl">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            About this event
          </p>
          <p className="mt-6 font-display text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.015em] text-[var(--text-primary)]">
            {event.overview}
          </p>
          {(event.details || true) && (
            <p className="mt-6 text-[1.125rem] leading-[1.8] text-[var(--text-secondary)]">
              {event.details ??
                "Join us for this event at Abu Dhabi University — a chance to connect with faculty, students, and industry professionals. Registration is open to all ADU community members."}
            </p>
          )}
        </FadeUp>
      </section>

      {/* ══════════════════════════════════════════════════════════
          GALLERY  — masonry, no fixed aspect crop
      ══════════════════════════════════════════════════════════ */}
      {gallery.length > 0 && (
        <section className={`border-b border-[var(--glass-border)] bg-[var(--bg-subtle)] py-16 sm:py-24 ${EDGE}`}>
          <FadeUp>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Gallery</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.03] tracking-[-0.025em] text-[var(--text-primary)]">
              Moments from the event.
            </h2>
          </FadeUp>
          <div className="mt-10" style={{ columns: "3 240px", columnGap: "0.75rem" }}>
            {gallery.map((g, i) => (
              <button
                key={i}
                onClick={() => setLightbox(i)}
                className="card-hover group mb-3 block w-full overflow-hidden rounded-[var(--r-lg)] border border-[var(--glass-border)]"
                style={{ breakInside: "avoid" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.url}
                  alt={g.caption ?? ""}
                  loading={i < 6 ? "eager" : "lazy"}
                  className="block w-full transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          LIGHTBOX
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {lightbox !== null && gallery[lightbox] && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/93 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <button onClick={() => setLightbox(null)} className="absolute right-5 top-5 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20" aria-label="Close">
              <X size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v! - 1 + gallery.length) % gallery.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Previous"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="relative h-[80vh] w-[90vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <Image src={gallery[lightbox].url} alt={gallery[lightbox].caption ?? ""} fill sizes="90vw" className="object-contain" />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v! + 1) % gallery.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Next"
            >
              <ChevronRight size={22} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          RELATED EVENTS
      ══════════════════════════════════════════════════════════ */}
      {related.length > 0 && (
        <section className="bg-[var(--bg-base)] py-20 sm:py-28">
          <FadeUp className={EDGE}>
            <p className="text-sm font-medium text-[var(--text-tertiary)]">More from {event.organizer}</p>
            <h2 className="mt-3 font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)]">
              Keep exploring.
            </h2>
          </FadeUp>

          <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pl-[clamp(1.25rem,5vw,5rem)] pr-[clamp(1.25rem,5vw,5rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {related.map((e, i) => (
              <FadeUp key={e.slug} delay={i * 0.06} className="w-[clamp(280px,80vw,360px)] shrink-0 snap-start">
                <Link href={`/events/${e.slug}`} className="faux-glass card-hover group flex h-full flex-col overflow-hidden">
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <Image
                      src={(e as DetailEvent).bannerUrl || e.image}
                      alt=""
                      fill
                      sizes="360px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-medium text-[var(--text-tertiary)]">{e.organizer}</span>
                    <h3 className="mt-2 font-display text-xl font-semibold leading-tight text-[var(--text-primary)]">{e.title}</h3>
                    <div className="mt-auto flex items-center gap-4 pt-5 text-[0.6875rem] tabular-nums text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} className="text-[var(--text-tertiary)]" /> {e.when}
                      </span>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            ))}
            <FadeUp delay={related.length * 0.06} className="flex w-[240px] shrink-0 snap-start items-center">
              <Link
                href="/events"
                className="group flex h-full w-full flex-col justify-center gap-3 border border-dashed border-[var(--glass-border)] px-6 text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                style={{ borderRadius: "var(--r-xl)" }}
              >
                <ArrowRight size={22} className="transition-transform group-hover:translate-x-1" />
                <span className="font-display text-lg font-semibold leading-tight">All events</span>
              </Link>
            </FadeUp>
          </div>
        </section>
      )}
    </>
  );
}
