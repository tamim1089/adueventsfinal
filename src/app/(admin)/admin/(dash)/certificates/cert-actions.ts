"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { graphSendMail } from "@/lib/graph/send-mail";

/**
 * Marks certificates as sent for a list of attendee IDs.
 * Used internally after a successful Graph API send.
 */
export async function markCertsSent(attendeeIds: string[]): Promise<{ ok: boolean; error?: string }> {
  if (!attendeeIds.length) return { ok: true };
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const now = new Date().toISOString();
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

export type AttendeeForEmail = { id: string; full_name: string; email: string };

/**
 * Sends certificate emails via Microsoft Graph API (as the signed-in admin's
 * @adu.ac.ae account) and marks them as sent in the DB.
 */
export async function sendCertificates(
  attendees: AttendeeForEmail[],
  eventTitle: string,
): Promise<{ ok: boolean; error?: string; needsLogin?: boolean; sent?: number }> {
  if (!attendees.length) return { ok: false, error: "No recipients selected." };

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const htmlBody = `
<div style="font-family:Arial,sans-serif;max-width:600px;color:#1a1a1a">
  <p>Dear attendee,</p>
  <p>Thank you for participating in <strong>${eventTitle}</strong>.</p>
  <p>Please find your certificate of participation attached, or download it from the ADU Events portal.</p>
  <br/>
  <p>Best regards,<br/>ADU Events Team</p>
</div>`.trim();

  const result = await graphSendMail({
    to: attendees.map((a) => ({ email: a.email, name: a.full_name })),
    subject: `Your Certificate — ${eventTitle}`,
    htmlBody,
  });

  if (!result.ok) return result;

  // Mark all sent in DB
  const markResult = await markCertsSent(attendees.map((a) => a.id));
  if (!markResult.ok) {
    // Email was sent but DB update failed — not critical, report partial success
    return { ok: true, sent: attendees.length, error: `Emails sent but DB update failed: ${markResult.error}` };
  }

  return { ok: true, sent: attendees.length };
}
