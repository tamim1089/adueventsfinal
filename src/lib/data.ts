// Server-side data layer. Reads published events / schools from Supabase via
// the anon key; falls back to the static seed when the DB is empty or
// unreachable — so the site works before AND after `0003_phase1.sql` is run,
// and flips to live data automatically once the DB is seeded.
import { createClient } from "@supabase/supabase-js";
import { EVENTS_DATA, type EventItem } from "@/lib/events-data";
import { SCHOOLS, type School } from "@/lib/schools-data";

export type Audience = "uni" | "external";
export type Event = EventItem & {
  id?: string;
  audience?: Audience;
  startsAt?: string;
  certificateDescription?: string | null;
  contactHours?: string | null;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = url && anon ? createClient(url, anon, { auth: { persistSession: false } }) : null;

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const evDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((evDay.getTime() - day0.getTime()) / 86400000);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diff === 0) return `Today · ${time}`;
  if (diff === 1) return `Tomorrow · ${time}`;
  if (diff > 1 && diff < 7) return `${d.toLocaleDateString("en-US", { weekday: "short" })} · ${time}`;
  if (diff < 0) return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ` · ${time}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): Event {
  return {
    slug: r.slug,
    title: r.title,
    organizer: r.organizers?.name ?? r.organizer ?? "Abu Dhabi University",
    venue: r.location ?? "",
    when: r.starts_at ? formatWhen(r.starts_at) : "",
    attending: r.attending ?? 0,
    overview: r.description ?? "",
    image: r.poster_path?.startsWith("/") ? r.poster_path : r.poster_path || "/media/photos/StudentsWorkingtogetheronamachinecoe-landing3.jpg",
    details: r.description ?? undefined,
    id: r.id,
    audience: r.audience ?? "uni",
    startsAt: r.starts_at ?? undefined,
    certificateDescription: r.certificate_description ?? null,
    contactHours: r.contact_hours ?? null,
  };
}

async function fetchEvents(): Promise<Event[] | null> {
  if (!sb) return null;
  const { data, error } = await sb
    .from("events")
    .select("*, organizers(name)")
    .eq("status", "published")
    .order("starts_at", { ascending: true });
  if (error || !data || data.length === 0) return null;
  return data.map(mapRow);
}

export async function getEvents(): Promise<{ upcoming: Event[]; past: Event[] }> {
  const rows = await fetchEvents();
  if (!rows) {
    return { upcoming: EVENTS_DATA.upcoming, past: EVENTS_DATA.past }; // static fallback
  }
  const now = Date.now();
  const upcoming: Event[] = [];
  const past: Event[] = [];
  for (const e of rows) {
    const t = e.startsAt ? new Date(e.startsAt).getTime() : now;
    if (t < now) past.push(e);
    else upcoming.push(e);
  }
  // soonest first for upcoming; most-recent first for past
  past.reverse();
  return { upcoming, past };
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const rows = await fetchEvents();
  if (rows) {
    const hit = rows.find((e) => e.slug === slug);
    if (hit) return hit;
  }
  const stat = [...EVENTS_DATA.upcoming, ...EVENTS_DATA.past].find((e) => e.slug === slug);
  return stat ? { ...stat, audience: "uni" } : null;
}

export async function searchSchools(query: string, limit = 20): Promise<School[]> {
  const q = query.trim();
  if (sb) {
    const req = sb.from("schools").select("id, name, category").order("name").limit(limit);
    const { data, error } = q ? await req.ilike("name", `%${q}%`) : await req;
    if (!error && data && data.length) return data as School[];
  }
  const filtered = q ? SCHOOLS.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())) : SCHOOLS;
  return filtered.slice(0, limit);
}
