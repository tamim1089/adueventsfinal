"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Marks certificates as sent for a list of attendee IDs.
 * Called client-side AFTER the Outlook window is opened.
 */
export async function markCertsSent(attendeeIds: string[]): Promise<{ ok: boolean; error?: string }> {
  if (!attendeeIds.length) return { ok: true };
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const now = new Date().toISOString();
  // upsert a row per attendee into certificates table (sent_at, email, event_id, attendee_id)
  const { error } = await sb
    .from("certificates")
    .upsert(
      attendeeIds.map((id) => ({ attendee_id: id, sent_at: now })),
      { onConflict: "attendee_id" }
    );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/certificates");
  return { ok: true };
}
