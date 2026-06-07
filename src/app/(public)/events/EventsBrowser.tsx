"use client";

import { useState } from "react";
import { Mountain } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TravelCard } from "@/components/ui/travel-card";
import { HotelCard } from "@/components/ui/hotel-card";
import { GlassFilter } from "@/components/ui/liquid-radio";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Reveal from "@/components/landing/Reveal";

const C = "/media/photos";

type EventItem = {
  title: string;
  organizer: string;
  venue: string;
  when: string;
  attending: number;
  overview: string;
  image: string;
};

const EVENTS: Record<"upcoming" | "past", EventItem[]> = {
  upcoming: [
    { title: "Founders & Funding Night", organizer: "Innovation Center", venue: "Auditorium A", when: "Today · 6:00 PM", attending: 210, overview: "Pitch sessions, investor panels, and networking for student founders.", image: `${C}/MaleStudents_Together_On_a_Table_500x350-13.jpeg` },
    { title: "Robotics Showcase", organizer: "College of Engineering", venue: "Lab Building 2", when: "Today · 6:30 PM", attending: 156, overview: "Senior projects and autonomous systems demos from the engineering labs.", image: `${C}/Student_Working_on_Machinecoe-landing2.jpg` },
    { title: "Research Skills Workshop", organizer: "Library", venue: "Learning Commons", when: "Tomorrow · 11:00 AM", attending: 88, overview: "Hands-on session on databases, citations, and literature reviews.", image: `${C}/TwoFemaleStudentsonatable_500x350-14.jpeg` },
    { title: "Industry Career Fair", organizer: "Admission & Registration", venue: "Main Hall", when: "Thu · 10:00 AM", attending: 540, overview: "Meet employers across engineering, business, health, and law.", image: `${C}/StudentsWorkingtogetheronamachinecoe-landing3.jpg` },
  ],
  past: [
    { title: "Welcome Week 2026", organizer: "Student Affairs Department", venue: "Main Green", when: "Last week", attending: 1200, overview: "Orientation, clubs fair, and guided tours for new students.", image: `${C}/StudentsWorkingtogetheronamachinecoe-landing3.jpg` },
    { title: "Health Sciences Symposium", organizer: "College of Health Sciences", venue: "Auditorium B", when: "2 weeks ago", attending: 320, overview: "Guest lectures and poster sessions on public health research.", image: `${C}/TwoFemaleStudentsonatable_500x350-14.jpeg` },
  ],
};

export default function EventsBrowser() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const list = EVENTS[tab];
  const featured = list[0];

  return (
    <div className="mx-auto max-w-6xl px-6 pt-32 pb-24">
      <Toaster richColors />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Events
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-[var(--text-primary)] sm:text-5xl">
            What&apos;s on at ADU
          </h1>
        </div>

        {/* liquid-glass swipe toggle */}
        <div className="inline-flex h-9 rounded-lg bg-input/50 p-0.5">
          <RadioGroup
            value={tab}
            onValueChange={(v) => setTab(v as "upcoming" | "past")}
            className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-md after:bg-background after:shadow-[0_1px_3px_rgba(0,0,0,0.12)] after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=upcoming]:after:translate-x-0 data-[state=past]:after:translate-x-full"
            data-state={tab}
          >
            <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden rounded-md" style={{ filter: 'url("#radio-glass")' }} />
            <label className="relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=upcoming]:text-foreground group-data-[state=past]:text-muted-foreground/70">
              Upcoming
              <RadioGroupItem id="ev-upcoming" value="upcoming" className="sr-only" />
            </label>
            <label className="relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=past]:text-foreground group-data-[state=upcoming]:text-muted-foreground/70">
              Past
              <RadioGroupItem id="ev-past" value="past" className="sr-only" />
            </label>
            <GlassFilter />
          </RadioGroup>
        </div>
      </div>

      {/* featured (wide) */}
      <Reveal className="mt-10">
        <HotelCard
          imageUrl={featured.image}
          imageAlt={featured.title}
          roomType={featured.organizer}
          hotelName={featured.title}
          location={featured.venue}
          when={featured.when}
          rating={5}
          reviewCount={featured.attending}
          href="#"
        />
      </Reveal>

      {/* grid */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.slice(1).map((e, i) => (
          <Reveal key={e.title} delay={i * 80}>
            <TravelCard
              className="h-[26rem]"
              imageUrl={e.image}
              imageAlt={e.title}
              logo={<Mountain className="h-6 w-6 text-white/80" />}
              title={e.title}
              location={`${e.organizer} · ${e.venue}`}
              overview={e.overview}
              price={`${e.attending}`}
              pricePeriod="attending"
              onBookNow={() => toast.success("Saved to your events", { description: e.title })}
            />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
