import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin, listOrganizers, getEvent, getAttendees, getPhotos, photoUrl } from "@/lib/admin/db";
import EventForm from "../../EventForm";
import SendCertsButton from "../SendCertsButton";
import PhotoManager from "../../../photos/PhotoManager";
import BannerPicker from "../BannerPicker";
import BannerUpload from "../BannerUpload";
import { clearEventBanner } from "../../../photos/actions";


export const metadata = { title: "Edit" };

export default async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireAdmin();
  const [organizers, event, attendees, allPhotos] = await Promise.all([
    listOrganizers(sb),
    getEvent(sb, id),
    getAttendees(sb, id),
    getPhotos(sb),
  ]);
  if (!event) notFound();
  const photos = allPhotos.filter((p) => p.event_id === id);
  const bannerUrl = photoUrl(event.banner_path);

  // eslint-disable-next-line react-hooks/purity
  const ended = new Date(event.ends_at).getTime() < Date.now();

  return (
    <div className="space-y-12">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Edit</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">{event.title}</h1>
      </div>

      <EventForm organizers={organizers} event={event} />

      {/* ── Banner ────────────────────────────────────────────── */}
      <section className="border-t border-[var(--glass-border)] pt-10 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-[-0.01em] text-[var(--text-primary)]">Banner</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              The hero image shown at the top of the public event page.
              {photos.length > 0 ? " Or click a gallery photo below to promote it as the banner." : ""}
            </p>
          </div>
          <BannerUpload eventId={event.id} />
        </div>

        {/* Current banner preview */}
        {bannerUrl ? (
          <div className="relative max-w-2xl overflow-hidden rounded-[var(--r-lg)] border border-[var(--glass-border)]">
            <Image src={bannerUrl} alt="" width={960} height={540} className="aspect-[16/9] w-full object-cover" />
            <form action={clearEventBanner.bind(null, event.id)} className="absolute right-3 top-3">
              <button className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[var(--danger)] shadow">
                Remove banner
              </button>
            </form>
          </div>
        ) : (
          <div className="flex max-w-2xl items-center justify-center rounded-[var(--r-lg)] border border-dashed border-[var(--glass-border)] bg-[var(--bg-subtle)] py-10 text-sm text-[var(--text-tertiary)]">
            No banner set
          </div>
        )}

        {/* Pick from gallery photos */}
        {photos.length > 0 && (
          <BannerPicker photos={photos} eventId={event.id} currentBannerPath={event.banner_path ?? null} />
        )}
      </section>

      {/* ── Gallery ───────────────────────────────────────────── */}
      <section className="border-t border-[var(--glass-border)] pt-10 space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-[-0.01em] text-[var(--text-primary)]">Gallery</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Upload photos that appear in the gallery on the public event page.</p>
        </div>
        <PhotoManager events={[{ id: event.id, title: event.title }]} photos={photos} lockedEventId={event.id} hideBannerControls />
      </section>

      {/* Registrants + certificate sending */}
      <section className="border-t border-[var(--glass-border)] pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-[-0.01em] text-[var(--text-primary)]">
              Registrants <span className="text-[var(--text-tertiary)]">({attendees.length})</span>
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {ended ? "Event has ended — you can email certificates now." : "Certificates are best sent after the event ends."}
            </p>
          </div>
          {attendees.length > 0 && <SendCertsButton eventId={event.id} />}
        </div>

        {attendees.length === 0 ? (
          <p className="mt-6 rounded-[var(--r-xl)] border border-dashed border-[var(--glass-border)] p-8 text-center text-[var(--text-secondary)]">
            No registrations yet.
          </p>
        ) : (
          <div className="mt-6 overflow-hidden border border-[var(--glass-border)]" style={{ borderRadius: "var(--r-xl)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-subtle)] text-left text-xs font-medium text-[var(--text-tertiary)]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Registered</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--glass-border)] last:border-0">
                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)]" dir="auto">{a.full_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{a.email ?? "—"}</td>
                    <td className="px-4 py-3 capitalize text-[var(--text-secondary)]">{a.audience === "external" ? "School" : "ADU"}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {a.audience === "external"
                        ? [a.school, a.grade].filter(Boolean).join(" · ") || "—"
                        : [a.uni_id, a.position].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-[var(--text-tertiary)]">
                      {new Date(a.registered_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
