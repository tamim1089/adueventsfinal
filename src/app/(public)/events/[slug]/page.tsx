import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, CalendarDays, Users } from "lucide-react";
import { EVENTS_DATA, EventItem } from "@/lib/events-data";

export async function generateStaticParams() {
  return Object.values(EVENTS_DATA).flat().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = findEvent(slug);
  return { title: event?.title ?? "Event" };
}

function findEvent(slug: string): EventItem | undefined {
  return Object.values(EVENTS_DATA).flat().find((e) => e.slug === slug);
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = findEvent(slug);
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Event not found</h1>
          <Link href="/events" className="mt-4 inline-block text-[var(--accent)]">← Back to events</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      {/* Hero image */}
      <div className="relative h-[50vh] min-h-64 w-full overflow-hidden">
        <Image
          src={event.image} alt={event.title}
          fill className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <Link
          href="/events"
          className="absolute top-[max(5rem,env(safe-area-inset-top))] left-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm text-white backdrop-blur-md hover:bg-black/60 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <span className="inline-block rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white mb-3">
            {event.organizer}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white leading-tight max-w-3xl">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
        {/* Meta strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: CalendarDays, label: "When",     value: event.when      },
            { icon: MapPin,       label: "Venue",    value: event.venue     },
            { icon: Users,        label: "Attending",value: `${event.attending.toLocaleString()} registered` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="faux-glass flex items-center gap-4 p-5 rounded-[20px]">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}
              >
                <Icon size={20} strokeWidth={2} />
              </span>
              <div>
                <p className="text-xs text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Overview */}
        <div className="faux-glass p-6 sm:p-8 rounded-[24px] mb-6">
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-3">About this event</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed text-base">
            {event.overview}
          </p>
          <p className="mt-4 text-[var(--text-secondary)] leading-relaxed text-base">
            {event.details ?? "Join us for this exciting event at Abu Dhabi University. This is a great opportunity to connect with faculty, students, and industry professionals. Registration is open to all ADU community members."}
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="flex-1 rounded-full py-4 text-base font-semibold text-white shadow-xl transition-transform active:scale-[0.97]"
            style={{ background: "var(--accent)" }}
          >
            Register to attend
          </button>
          <Link
            href="/events"
            className="flex-1 rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] py-4 text-center text-base font-semibold text-[var(--text-primary)] transition-transform active:scale-[0.97] hover:border-[var(--accent)]"
          >
            ← All events
          </Link>
        </div>
      </div>
    </main>
  );
}
