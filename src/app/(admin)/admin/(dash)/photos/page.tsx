import { requireAdmin, listEvents, getPhotos } from "@/lib/admin/db";
import PhotoManager from "./PhotoManager";

export const metadata = { title: "Photos" };

export default async function Photos() {
  const { sb } = await requireAdmin();
  const [events, photos] = await Promise.all([listEvents(sb), getPhotos(sb)]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Photos</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">Event galleries</h1>
        <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">
          Upload, crop, and manage photos for each event. Set any photo as the event&apos;s banner.
        </p>
      </div>
      <PhotoManager events={events.map((e) => ({ id: e.id, title: e.title }))} photos={photos} />
    </div>
  );
}
