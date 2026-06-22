// Server component — fetches live events from Supabase and passes them as props
// to client components. FadeUp animations are isolated in a tiny client wrapper.
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { ORGANIZERS } from "@/lib/organizers";
import HeroSlides, { type LiveEvent } from "@/components/home/HeroSlides";
import TabletShowcase from "@/components/home/TabletShowcase";
import { getEvents } from "@/lib/data";
import LandingAnimations from "@/components/home/LandingAnimations";

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

const FEATURES = [
  { iconName: "CalendarRange", title: "Browse by organizer", body: "Jump straight to any college, department, or center. Eleven organizers, one map." },
  { iconName: "ImageUp", title: "Posters, dates & venues", body: "Every event carries its poster, schedule, and location — clear at a glance." },
  { iconName: "BadgeCheck", title: "Attendance & certificates", body: "Upload attendance, then auto-generate and share certificates in a click." },
  { iconName: "MessageSquareText", title: "Post-event surveys", body: "Collect participant feedback with a survey attached to the event." },
  { iconName: "Images", title: "Photo galleries", body: "Document the day. Highlight student life with post-event photos." },
  { iconName: "FileBarChart", title: "Reports & reviews", body: "Download per-event reports and publish each department's annual report." },
];

export default async function LandingPage() {
  // Fetch live events — falls back to static data when DB is empty or unreachable
  const { upcoming } = await getEvents();

  const liveEvents: LiveEvent[] = upcoming.slice(0, 3).map((e) => ({
    slug: e.slug,
    title: e.title,
    organizer: e.organizer,
    when: e.when,
    venue: e.venue,
    image: e.image,
    bannerUrl: e.bannerUrl ?? null,
  }));

  return (
    <>
      {/* BAND 1+2 — pinned horizontal: hero slides left into the live-events slide */}
      <HeroSlides events={liveEvents} />

      {/* BAND 3 — tablet showcase */}
      <TabletShowcase />

      {/* BAND 4 — organizers index */}
      <section id="organizers" className="border-b border-[var(--glass-border)] bg-[var(--bg-subtle)]">
        <div className={`grid grid-cols-1 gap-12 py-20 sm:py-28 lg:grid-cols-12 ${EDGE}`}>
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-medium text-[var(--text-tertiary)]">02 — Organizers</p>
              <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.04] tracking-[-0.02em] text-[var(--text-primary)]">Eleven ways in.</h2>
              <p className="mt-4 max-w-xs text-[var(--text-secondary)]">Every college, department, and center publishes here. Pick a source and follow only what matters to you.</p>
            </div>
          </div>
          <ul className="lg:col-span-8">
            {ORGANIZERS.map((o, i) => (
              <li key={o.slug}>
                <Link href="/events" className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-t border-[var(--glass-border)] py-5 last:border-b">
                  <span className="font-mono text-sm tabular-nums text-[var(--text-tertiary)]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-xl font-medium leading-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)] sm:text-2xl">{o.name}</span>
                  <span className="flex items-center gap-3">
                    <span className="hidden text-xs font-medium text-[var(--text-tertiary)] sm:inline">{o.kind}</span>
                    <ArrowUpRight size={18} className="-translate-x-1 text-[var(--text-tertiary)] opacity-0 transition-all group-hover:translate-x-0 group-hover:text-[var(--accent)] group-hover:opacity-100" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* BAND 5 — features (animations handled client-side in LandingAnimations) */}
      <LandingAnimations features={FEATURES} />

      {/* BAND 6 — CTA */}
      <section className={`py-24 sm:py-32 ${EDGE}`} style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)" }}>
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="max-w-xl font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.04] tracking-[-0.02em] text-white">Run your next event here.</h2>
            <p className="mt-4 max-w-md text-white/85">Organizers across ADU publish, track, and document events in one workspace.</p>
          </div>
          <Link href="/admin" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[var(--accent-strong)] transition-transform active:scale-[0.98]">
            Sign in to get started <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}

