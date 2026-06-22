import type { Metadata } from "next";
import { getEvents } from "@/lib/data";
import EventsBrowser from "./EventsBrowser";

export const metadata: Metadata = {
  title: "Events",
  description: "Browse upcoming and past events across ADU.",
};

export default async function EventsPage() {
  const { upcoming, past } = await getEvents();
  return <EventsBrowser initialUpcoming={upcoming} initialPast={past} />;
}
