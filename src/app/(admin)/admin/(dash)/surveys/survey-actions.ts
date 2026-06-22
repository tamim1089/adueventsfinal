"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { graphSendMail } from "@/lib/graph/send-mail";

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

export type SurveyRecipient = { email: string; name?: string };

/**
 * Sends the survey link to a list of recipients via Microsoft Graph API.
 * Falls back with needsLogin=true if no MS token is present.
 */
export async function sendSurveyEmails(
  recipients: SurveyRecipient[],
  surveyTitle: string,
  eventTitle: string,
  surveyUrl: string,
): Promise<{ ok: boolean; error?: string; needsLogin?: boolean; sent?: number }> {
  if (!recipients.length) return { ok: false, error: "No recipients." };

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const htmlBody = `
<div style="font-family:Arial,sans-serif;max-width:600px;color:#1a1a1a">
  <p>Dear attendee,</p>
  <p>Thank you for attending <strong>${eventTitle}</strong>. We would love to hear your feedback.</p>
  <p>Please fill in our short survey:<br/>
    <a href="${surveyUrl}" style="color:#c0392b">${surveyUrl}</a>
  </p>
  <br/>
  <p>Best regards,<br/>ADU Events Team</p>
</div>`.trim();

  const result = await graphSendMail({
    to: recipients,
    subject: `Feedback survey — ${surveyTitle}`,
    htmlBody,
  });

  if (!result.ok) return result;
  return { ok: true, sent: recipients.length };
}

