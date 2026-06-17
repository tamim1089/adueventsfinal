import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEvents, getEventBySlug, searchSchools, getEventPhotos } from "@/lib/data";
import EventDetail from "./EventDetail";

export async function generateStaticParams() {
  const { upcoming, past } = await getEvents();
  return [...upcoming, ...past].map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const { upcoming, past } = await getEvents();
  const all = [...upcoming, ...past].filter((e) => e.slug !== event.slug);
  const related = [
    ...all.filter((e) => e.organizer === event.organizer),
    ...all.filter((e) => e.organizer !== event.organizer),
  ].slice(0, 4);

  const schools = event.audience === "external" ? await searchSchools("", 200) : [];
  const gallery = event.id ? await getEventPhotos(event.id) : [];

  return <EventDetail event={event} related={related} schools={schools} gallery={gallery} />;
}
