"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Clock, MapPin, Users, ArrowRight, Radio, CalendarDays } from "lucide-react";
import { EVENTS_DATA, type EventItem } from "@/lib/events-data";
import type { Event as LiveEvent } from "@/lib/data";
import { ActionSearchBar, type Action } from "@/components/ui/action-search-bar";

// Flat list across upcoming + past, for the quick-jump search.
const SEARCH_ACTIONS: Action[] = [...EVENTS_DATA.upcoming, ...EVENTS_DATA.past].map((e) => ({
  id: e.slug,
  label: e.title,
  description: e.organizer,
  end: e.when,
  href: `/events/${e.slug}`,
  icon: e.when.startsWith("Today") ? (
    <Radio className="h-4 w-4" />
  ) : (
    <CalendarDays className="h-4 w-4" />
  ),
}));

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";
const EASE = [0.2, 0.8, 0.2, 1] as const;

type Tab = "upcoming" | "past";

/* ---- editorial event card ------------------------------------------------ */
type AnyEvent = EventItem & { bannerUrl?: string | null };

function EventCard({ event, index }: { event: AnyEvent; index: number }) {
  const reduce = useReducedMotion();
  const live = event.when.startsWith("Today");
  const thumb = (event.bannerUrl) || event.image;
  return (
    <motion.div
      layout
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: Math.min(index, 8) * 0.04 }}
    >
      <Link
        href={`/events/${event.slug}`}
        className="faux-glass card-hover group flex h-full flex-col overflow-hidden"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={thumb}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {live && (
            <span
              className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
              style={{ background: "var(--accent)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <span className="text-xs font-medium text-[var(--text-tertiary)]">
            {event.organizer}
          </span>
          <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-[var(--text-primary)]">
            {event.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {event.overview}
          </p>
          <div className="mt-auto flex items-center gap-4 pt-5 font-mono text-[0.6875rem] tabular-nums text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} className="text-[var(--text-tertiary)]" />
              {event.when}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="text-[var(--text-tertiary)]" />
              {event.venue}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function EventsBrowser({
  initialUpcoming,
  initialPast,
}: {
  initialUpcoming?: LiveEvent[];
  initialPast?: LiveEvent[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [filter, setFilter] = useState<string>("all");

  // Use live DB events if provided, otherwise fall back to static seed
  const liveUpcoming = initialUpcoming && initialUpcoming.length > 0 ? initialUpcoming : EVENTS_DATA.upcoming;
  const livePast = initialPast && initialPast.length > 0 ? initialPast : EVENTS_DATA.past;

  // If upcoming is empty, auto-show past so users don't see a blank page
  const effectiveTab = tab === "upcoming" && liveUpcoming.length === 0 ? "past" : tab;

  const tabEvents: AnyEvent[] = effectiveTab === "upcoming" ? liveUpcoming : livePast;
  const organizers = Array.from(new Set(tabEvents.map((e) => e.organizer)));

  const filtered = tabEvents.filter((e) => {
    if (filter === "all") return true;
    if (filter === "live") return e.when.startsWith("Today");
    return e.organizer === filter;
  });

  const showFeatured = effectiveTab === "upcoming" && filter === "all" && filtered.length > 0;
  const featured = showFeatured ? filtered[0] : null;
  const gridEvents = showFeatured ? filtered.slice(1) : filtered;

  const switchTab = (t: Tab) => {
    setTab(t);
    setFilter("all");
  };

  const FILTERS: { key: string; label: string }[] = [
    { key: "all", label: "All events" },
    ...(tab === "upcoming" ? [{ key: "live", label: "Live now" }] : []),
    ...organizers.map((o) => ({ key: o, label: o })),
  ];

  return (
    <section className={`pb-24 pt-28 ${EDGE}`}>
      {/* header */}
      <div className="flex flex-col gap-6 border-b border-[var(--glass-border)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-tertiary)]">
            Abu Dhabi University
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-[var(--text-primary)]">
            Events
          </h1>
        </div>

        {/* tab switch — text links with a sliding underline, not a pill */}
        <div className="flex items-center gap-8">
          {(["upcoming", "past"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`relative pb-2 text-base font-semibold capitalize transition-colors ${
                tab === t ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {t}
              {tab === t && (
                <motion.span
                  layoutId="events-tab-underline"
                  className="absolute inset-x-0 bottom-0 h-0.5"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* quick-jump search */}
      <div className="relative z-30 mt-8 max-w-xl">
        <ActionSearchBar
          actions={SEARCH_ACTIONS}
          label="Search events"
          placeholder="Search events, organizers…"
          onSelect={(a) => a.href && router.push(a.href)}
        />
      </div>

      {/* rail + content */}
      <div className="grid grid-cols-1 gap-10 pt-10 lg:grid-cols-[240px_1fr]">
        {/* filter rail */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="hidden text-xs font-medium text-[var(--text-tertiary)] lg:block">
            Filter
          </p>
          <div className="mt-0 flex gap-2 overflow-x-auto pb-2 lg:mt-4 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-left text-sm transition-colors lg:rounded-none lg:border-0 lg:border-l-2 lg:px-3 lg:py-2.5 ${
                    active
                      ? "border-[var(--accent)] text-[var(--text-primary)] lg:border-l-[var(--accent)] lg:font-medium"
                      : "border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] lg:border-l-transparent"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* content */}
        <div>
          {/* featured split — fully clickable */}
          {featured && (
            <motion.div layout initial={false} className="mb-8">
              <Link
                href={`/events/${featured.slug}`}
                className="faux-glass card-hover group grid grid-cols-1 overflow-hidden md:grid-cols-2"
              >
                <div className="relative min-h-[220px] md:min-h-[340px]">
                  <Image
                    src={(featured as AnyEvent).bannerUrl || featured.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex flex-col justify-center p-7 sm:p-9">
                  <p className="text-sm font-medium text-[var(--accent)]">
                    Featured · {featured.organizer}
                  </p>
                  <h2 className="mt-3 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)]">
                    {featured.title}
                  </h2>
                  <p className="mt-3 max-w-md leading-relaxed text-[var(--text-secondary)]">
                    {featured.overview}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--glass-border)] pt-5 font-mono text-[0.75rem] tabular-nums text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-2">
                      <Clock size={14} className="text-[var(--text-tertiary)]" /> {featured.when}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={14} className="text-[var(--text-tertiary)]" /> {featured.venue}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Users size={14} className="text-[var(--text-tertiary)]" /> {featured.attending} attending
                    </span>
                  </div>
                  <span className="mt-6 inline-flex w-fit items-center gap-2 font-semibold text-[var(--accent)] transition-transform group-hover:translate-x-1">
                    View full details <ArrowRight size={17} />
                  </span>
                </div>
              </Link>
            </motion.div>
          )}

          {/* fluid grid */}
          {gridEvents.length > 0 ? (
            <motion.div
              layout
              className="grid gap-5"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
            >
              <AnimatePresence mode="popLayout">
                {gridEvents.map((e, i) => (
                  <EventCard key={e.slug} event={e} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            !featured && (
              <div className="flex flex-col items-start gap-3 border border-dashed border-[var(--glass-border)] p-10" style={{ borderRadius: "var(--r-xl)" }}>
                <p className="font-display text-2xl font-semibold text-[var(--text-primary)]">
                  Nothing here yet.
                </p>
                <p className="max-w-sm text-[var(--text-secondary)]">
                  No {tab} events match this filter. Try another organizer or
                  switch back to all events.
                </p>
                <button
                  onClick={() => setFilter("all")}
                  className="mt-1 inline-flex items-center gap-2 font-semibold text-[var(--accent)]"
                >
                  Show all events <ArrowRight size={16} />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
