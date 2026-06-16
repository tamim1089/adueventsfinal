import { requireAdmin, listOrganizers } from "@/lib/admin/db";
import EventForm from "../EventForm";

export const metadata = { title: "New event" };

export default async function NewEvent() {
  const { sb } = await requireAdmin();
  const organizers = await listOrganizers(sb);
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Create</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">New event</h1>
      </div>
      <EventForm organizers={organizers} />
    </div>
  );
}
