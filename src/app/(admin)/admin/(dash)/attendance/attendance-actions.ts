"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Toggle the check-in state for a single attendee.
 * If checkIn=true: sets checked_in_at = now()
 * If checkIn=false: clears checked_in_at = null
 */
export async function toggleCheckIn(
  attendeeId: string,
  eventId: string,
  checkIn: boolean
): Promise<{ ok: boolean; error?: string }> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await sb
    .from("attendees")
    .update({ checked_in_at: checkIn ? new Date().toISOString() : null })
    .eq("id", attendeeId)
    .eq("event_id", eventId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/attendance");
  return { ok: true };
}
