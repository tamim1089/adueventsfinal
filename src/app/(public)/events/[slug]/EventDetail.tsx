"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, MapPin, Users, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { EventItem } from "@/lib/events-data";
import type { School } from "@/lib/schools-data";
import type { GalleryPhoto } from "@/lib/data";
import RegistrationSheet from "./RegistrationSheet";

type DetailEvent = EventItem & { id?: string; audience?: "uni" | "external"; bannerUrl?: string | null };

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";
const EASE = [0.2, 0.8, 0.2, 1] as const;

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const FACTS = (e: EventItem) => [
  { icon: Clock, label: "When", value: e.when },
  { icon: MapPin, label: "Venue", value: e.venue },
  { icon: Users, label: "Attending", value: `${e.attending.toLocaleString()} registered` },
];

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
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <>
      {/* ===== full-bleed hero ===== */}
      <section className="relative flex h-[clamp(420px,70vh,720px)] w-full flex-col justify-end overflow-hidden">
        <Image src={event.bannerUrl || event.image} alt="" fill priority sizes="100vw" className="object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(16,12,10,0.35) 0%, rgba(16,12,10,0.2) 35%, rgba(16,12,10,0.85) 100%)" }}
        />

        <Link
          href="/events"
          className={`absolute left-[clamp(1.25rem,4vw,5rem)] top-20 inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10`}
        >
          <ArrowLeft size={16} /> All events
        </Link>

        <div className={`relative z-10 pb-12 ${EDGE}`}>
          <p className="text-sm font-medium text-[var(--accent)]">
            {event.organizer}
          </p>
          <motion.h1
            className="mt-4 max-w-4xl font-display text-[clamp(2.25rem,6vw,5rem)] font-bold leading-[0.98] tracking-[-0.03em] text-white"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          >
            {event.title}
          </motion.h1>
        </div>
      </section>

      {/* ===== body: facts rail (left) + reading column (right) ===== */}
      <section className={`border-b border-[var(--glass-border)] bg-[var(--bg-base)] py-16 sm:py-24 ${EDGE}`}>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* facts rail */}
          <FadeUp className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <dl className="border-y border-[var(--glass-border)] divide-y divide-[var(--glass-border)]">
                {FACTS(event).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4 py-4">
                    <Icon size={16} className="shrink-0 text-[var(--text-tertiary)]" />
                    <div>
                      <dt className="text-xs font-medium text-[var(--text-tertiary)]">
                        {label}
                      </dt>
                      <dd className="mt-1 font-mono text-sm tabular-nums text-[var(--text-primary)]">
                        {value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>

              {event.id ? (
                <RegistrationSheet
                  event={{ id: event.id, title: event.title, audience: event.audience ?? "uni" }}
                  schools={schools}
                />
              ) : null}
            </div>
          </FadeUp>

          {/* reading column */}
          <FadeUp delay={0.08} className="lg:col-span-8">
            <div className="max-w-[65ch]">
              <p className="text-sm font-medium text-[var(--text-tertiary)]">
                About this event
              </p>
              <p className="mt-5 text-xl leading-relaxed text-[var(--text-primary)]">
                {event.overview}
              </p>
              <p className="mt-5 text-lg leading-relaxed text-[var(--text-secondary)]">
                {event.details ??
                  "Join us for this event at Abu Dhabi University — a chance to connect with faculty, students, and industry professionals. Registration is open to all ADU community members."}
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ===== gallery ===== */}
      {gallery.length > 0 && (
        <section className={`border-b border-[var(--glass-border)] bg-[var(--bg-subtle)] py-16 sm:py-20 ${EDGE}`}>
          <FadeUp>
            <p className="text-sm font-medium text-[var(--text-tertiary)]">Gallery</p>
            <h2 className="mt-3 font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)]">Moments from the event.</h2>
          </FadeUp>
          <div className="mt-8 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {gallery.map((g, i) => (
              <button key={i} onClick={() => setLightbox(i)} className="card-hover group relative aspect-[4/3] overflow-hidden rounded-[var(--r-lg)] border border-[var(--glass-border)]">
                <Image src={g.url} alt={g.caption ?? ""} fill sizes="240px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* lightbox */}
      <AnimatePresence>
        {lightbox !== null && gallery[lightbox] && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <button onClick={() => setLightbox(null)} className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close"><X size={22} /></button>
            <button onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v! - 1 + gallery.length) % gallery.length); }} className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Previous"><ChevronLeft size={22} /></button>
            <div className="relative h-[80vh] w-[90vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <Image src={gallery[lightbox].url} alt={gallery[lightbox].caption ?? ""} fill sizes="90vw" className="object-contain" />
            </div>
            <button onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v! + 1) % gallery.length); }} className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Next"><ChevronRight size={22} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== related — full-bleed strip ===== */}
      {related.length > 0 && (
        <section className="bg-[var(--bg-base)] py-20 sm:py-28">
          <FadeUp className={EDGE}>
            <p className="text-sm font-medium text-[var(--text-tertiary)]">
              More from {event.organizer}
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)]">
              Keep exploring.
            </h2>
          </FadeUp>

          <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pl-[clamp(1.25rem,4vw,5rem)] pr-[clamp(1.25rem,4vw,5rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {related.map((e, i) => (
              <FadeUp key={e.slug} delay={i * 0.06} className="w-[clamp(280px,80vw,360px)] shrink-0 snap-start">
                <Link
                  href={`/events/${e.slug}`}
                  className="faux-glass card-hover group flex h-full flex-col overflow-hidden"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <Image
                      src={e.image}
                      alt=""
                      fill
                      sizes="360px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-medium text-[var(--text-tertiary)]">
                      {e.organizer}
                    </span>
                    <h3 className="mt-2 font-display text-xl font-semibold leading-tight text-[var(--text-primary)]">
                      {e.title}
                    </h3>
                    <div className="mt-auto flex items-center gap-4 pt-5 font-mono text-[0.6875rem] tabular-nums text-[var(--text-secondary)]">
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
