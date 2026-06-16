import { notFound } from "next/navigation";
import { requireAdmin, listOrganizers, getEvent } from "@/lib/admin/db";
import EventForm from "../../EventForm";

export const metadata = { title: "Edit event" };

export default async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireAdmin();
  const [organizers, event] = await Promise.all([listOrganizers(sb), getEvent(sb, id)]);
  if (!event) notFound();
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Edit</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">{event.title}</h1>
      </div>
      <EventForm organizers={organizers} event={event} />
    </div>
  );
}
