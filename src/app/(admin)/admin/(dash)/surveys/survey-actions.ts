"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSurvey(
  eventId: string,
  title: string,
  url: string
): Promise<{ ok: boolean; error?: string }> {
  if (!eventId || !title.trim()) return { ok: false, error: "Event and title are required." };
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await sb.from("surveys").insert({ event_id: eventId, title: title.trim(), url: url.trim() || null });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/surveys");
  return { ok: true };
}

export async function deleteSurvey(surveyId: string): Promise<{ ok: boolean; error?: string }> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await sb.from("surveys").delete().eq("id", surveyId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/surveys");
  return { ok: true };
}
