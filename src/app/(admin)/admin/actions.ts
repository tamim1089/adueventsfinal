"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findConflict } from "@/lib/admin/db";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 64) || "event";
}

export type EventInput = {
  id?: string;
  title: string;
  organizer_id: string;
  starts_at: string; // ISO (from datetime-local)
  ends_at: string;
  location: string;
  audience: "uni" | "external";
  status: "draft" | "published" | "archived";
  description: string;
  certificate_description: string;
  contact_hours: string;
};

type Result = { ok: true; id: string } | { ok: false; error: string };

export async function saveEvent(input: EventInput): Promise<Result> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (!input.title.trim()) return { ok: false, error: "Title is required." };
  if (!input.organizer_id) return { ok: false, error: "Pick an organizer." };
  if (!input.starts_at || !input.ends_at) return { ok: false, error: "Start and end times are required." };
  const startsAt = new Date(input.starts_at).toISOString();
  const endsAt = new Date(input.ends_at).toISOString();
  if (new Date(endsAt) < new Date(startsAt)) return { ok: false, error: "End time must be after the start time." };

  // conflict: no overlapping event in the same venue
  if (input.location.trim()) {
    const clash = await findConflict(sb, { location: input.location.trim(), startsAt, endsAt, ignoreId: input.id });
    if (clash) {
      return { ok: false, error: `Conflicts with "${clash.title}" in ${input.location} at that time.` };
    }
  }

  const row = {
    title: input.title.trim(),
    organizer_id: input.organizer_id,
    starts_at: startsAt,
    ends_at: endsAt,
    location: input.location.trim() || null,
    audience: input.audience,
    status: input.status,
    description: input.description.trim() || null,
    certificate_description: input.certificate_description.trim() || null,
    contact_hours: input.contact_hours.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await sb.from("events").update(row).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/events");
    revalidatePath("/admin/calendar");
    return { ok: true, id: input.id };
  }

  const { data, error } = await sb
    .from("events")
    .insert({ ...row, slug: `${slugify(input.title)}-${Math.random().toString(36).slice(2, 6)}`, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Couldn't create the event." };
  revalidatePath("/admin/events");
  revalidatePath("/admin/calendar");
  return { ok: true, id: data.id };
}

export async function setEventStatus(id: string, status: "draft" | "published" | "archived") {
  const sb = await createClient();
  await sb.from("events").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/events");
  revalidatePath("/admin/calendar");
}

export async function deleteEvent(id: string) {
  const sb = await createClient();
  await sb.from("events").delete().eq("id", id);
  revalidatePath("/admin/events");
  revalidatePath("/admin/calendar");
}

export async function signOut() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect("/admin/login");
}
