import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Gate every admin surface: must be signed in. Returns the session client +
// profile so pages can read/write under the user's RLS (admins can do all).
export async function requireAdmin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await sb
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  return { sb, user, profile };
}

export type AdminEvent = {
  id: string;
  slug: string | null;
  title: string;
  organizer_id: string;
  organizer: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  description: string | null;
  status: "draft" | "published" | "archived";
  audience: "uni" | "external";
  attending: number;
  certificate_description: string | null;
  contact_hours: string | null;
};

type SB = Awaited<ReturnType<typeof createClient>>;

export async function listOrganizers(sb: SB) {
  const { data } = await sb.from("organizers").select("id, name, slug").order("sort_order");
  return data ?? [];
}

export async function listEvents(sb: SB): Promise<AdminEvent[]> {
  const { data } = await sb
    .from("events")
    .select("*, organizers(name)")
    .order("starts_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({ ...r, organizer: r.organizers?.name ?? "—" }));
}

export async function getEvent(sb: SB, id: string): Promise<AdminEvent | null> {
  const { data } = await sb.from("events").select("*, organizers(name)").eq("id", id).maybeSingle();
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = data as any;
  return { ...r, organizer: r.organizers?.name ?? "—" };
}

export async function getOverview(sb: SB) {
  const nowIso = new Date().toISOString();
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
  const [published, certificates, surveyResponses] = await Promise.all([
    count(sb.from("events").select("id", { count: "exact", head: true }).eq("status", "published")),
    count(sb.from("certificates").select("id", { count: "exact", head: true })),
    count(sb.from("survey_responses").select("id", { count: "exact", head: true })),
  ]);
  const { count: liveNow } = await sb
    .from("events")
    .select("id", { count: "exact", head: true })
    .lte("starts_at", nowIso)
    .gte("ends_at", nowIso)
    .eq("status", "published");
  const { data: recent } = await sb
    .from("events")
    .select("id, title, slug, starts_at, status, organizers(name)")
    .order("starts_at", { ascending: false })
    .limit(6);
  return {
    published,
    liveNow: liveNow ?? 0,
    certificates,
    surveyResponses,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recent: (recent ?? []).map((r: any) => ({ ...r, organizer: r.organizers?.name ?? "—" })),
  };
}

export type Attendee = {
  id: string;
  full_name: string;
  email: string | null;
  audience: string | null;
  uni_id: string | null;
  position: string | null;
  grade: string | null;
  school: string | null;
  registered_at: string;
};

export async function getAttendees(sb: SB, eventId: string): Promise<Attendee[]> {
  const { data } = await sb
    .from("attendees")
    .select("id, full_name, email, audience, uni_id, position, grade, registered_at, schools(name)")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((a: any) => ({ ...a, school: a.schools?.name ?? null }));
}

// Returns an overlapping published/draft event in the same venue, if any.
export async function findConflict(
  sb: SB,
  opts: { location: string; startsAt: string; endsAt: string; ignoreId?: string }
): Promise<AdminEvent | null> {
  if (!opts.location) return null;
  const { data } = await sb
    .from("events")
    .select("*, organizers(name)")
    .eq("location", opts.location)
    .lt("starts_at", opts.endsAt)
    .gt("ends_at", opts.startsAt);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hit = (data ?? []).find((e: any) => e.id !== opts.ignoreId);
  if (!hit) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = hit as any;
  return { ...r, organizer: r.organizers?.name ?? "—" };
}
