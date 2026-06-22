"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function requireUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function uploadPhoto(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireUser())) return { ok: false, error: "Not signed in." };
  const eventId = String(formData.get("eventId") || "");
  const caption = String(formData.get("caption") || "");
  const file = formData.get("file") as File | null;
  if (!eventId) return { ok: false, error: "Pick an event." };
  if (!file) return { ok: false, error: "No image." };

  const buf = Buffer.from(await file.arrayBuffer());
  const path = `${eventId}/${randomUUID()}.jpg`;
  const up = await supabaseAdmin.storage.from("photos").upload(path, buf, { contentType: "image/jpeg", upsert: false });
  if (up.error) return { ok: false, error: up.error.message };
  const ins = await supabaseAdmin.from("photos").insert({ event_id: eventId, path, caption: caption || null });
  if (ins.error) return { ok: false, error: ins.error.message };
  revalidatePath("/admin/photos");
  return { ok: true };
}

export async function deletePhoto(id: string, path: string): Promise<void> {
  if (!(await requireUser())) return;
  await supabaseAdmin.storage.from("photos").remove([path]);
  await supabaseAdmin.from("photos").delete().eq("id", id);
  revalidatePath("/admin/photos");
}

export async function clearEventBanner(eventId: string): Promise<void> {
  if (!(await requireUser())) return;
  await supabaseAdmin.from("events").update({ banner_path: null }).eq("id", eventId);
  revalidatePath("/admin/photos");
  revalidatePath(`/admin/events/${eventId}/edit`);
}

export async function setEventBanner(eventId: string, path: string): Promise<void> {
  if (!(await requireUser())) return;
  // banners live in the posters bucket convention, but a gallery photo can be
  // promoted: store its public photos path on the event.
  await supabaseAdmin.from("events").update({ banner_path: path }).eq("id", eventId);

  // Fetch the event slug so we can revalidate the public detail page.
  const { data: ev } = await supabaseAdmin.from("events").select("slug").eq("id", eventId).maybeSingle();

  revalidatePath("/admin/photos");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}/edit`);
  revalidatePath("/events");
  if (ev?.slug) revalidatePath(`/events/${ev.slug}`);
}

export async function uploadBanner(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireUser())) return { ok: false, error: "Not signed in." };
  const eventId = String(formData.get("eventId") || "");
  const file = formData.get("file") as File | null;
  if (!eventId) return { ok: false, error: "Missing eventId." };
  if (!file) return { ok: false, error: "No image." };

  const buf = Buffer.from(await file.arrayBuffer());
  const path = `${eventId}/${randomUUID()}.jpg`;
  const up = await supabaseAdmin.storage.from("photos").upload(path, buf, { contentType: "image/jpeg", upsert: false });
  if (up.error) return { ok: false, error: up.error.message };

  const upd = await supabaseAdmin.from("events").update({ banner_path: path }).eq("id", eventId);
  if (upd.error) return { ok: false, error: upd.error.message };

  const { data: ev } = await supabaseAdmin.from("events").select("slug").eq("id", eventId).maybeSingle();

  revalidatePath("/admin/photos");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}/edit`);
  revalidatePath("/events");
  if (ev?.slug) revalidatePath(`/events/${ev.slug}`);

  return { ok: true };
}
