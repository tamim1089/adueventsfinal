import type { Metadata } from "next";
import EventsBrowser from "./EventsBrowser";

export const metadata: Metadata = {
  title: "Events",
  description: "Browse upcoming and past events across ADU.",
};

export default function EventsPage() {
  return <EventsBrowser />;
}
