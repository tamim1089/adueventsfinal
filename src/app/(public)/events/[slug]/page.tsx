import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENTS_DATA, type EventItem } from "@/lib/events-data";
import EventDetail from "./EventDetail";

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
  if (!event) notFound();

  // Related: same organizer first, then fill with other events.
  const all = Object.values(EVENTS_DATA).flat().filter((e) => e.slug !== event.slug);
  const sameOrg = all.filter((e) => e.organizer === event.organizer);
  const others = all.filter((e) => e.organizer !== event.organizer);
  const related = [...sameOrg, ...others].slice(0, 4);

  return <EventDetail event={event} related={related} />;
}
