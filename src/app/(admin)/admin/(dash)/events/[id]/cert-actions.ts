"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { renderCertificatePdf, defaultCertificateDescription } from "@/lib/certificates/generate";

type Result = { ok: true; sent: number; skipped: number } | { ok: false; error: string };

export async function sendCertificates(eventId: string): Promise<Result> {
  // must be signed in (admin uses the dashboard)
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set on the server." };
  const resend = new Resend(key);

  const { data: ev } = await supabaseAdmin.from("events").select("*, organizers(name)").eq("id", eventId).maybeSingle();
  if (!ev) return { ok: false, error: "Event not found." };

  const { data: attendees } = await supabaseAdmin.from("attendees").select("*").eq("event_id", eventId);
  if (!attendees || attendees.length === 0) return { ok: false, error: "No registrants to send to yet." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const evAny = ev as any;
  const description =
    evAny.certificate_description ||
    defaultCertificateDescription({
      eventTitle: evAny.title,
      organizer: evAny.organizers?.name ?? "Abu Dhabi University",
      when: new Date(evAny.starts_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      contactHours: evAny.contact_hours ?? undefined,
    });

  // fresh issue (idempotent re-send)
  await supabaseAdmin.from("certificates").delete().eq("event_id", eventId);

  let sent = 0;
  let skipped = 0;
  for (const a of attendees) {
    if (!a.email) { skipped++; continue; }
    try {
      const pdf = await renderCertificatePdf({
        templateKey: evAny.certificate_template || "udl",
        name: a.full_name,
        description,
      });
      const path = `${eventId}/${a.id}.pdf`;
      await supabaseAdmin.storage.from("certificates").upload(path, Buffer.from(pdf), {
        upsert: true,
        contentType: "application/pdf",
      });
      await supabaseAdmin.from("certificates").insert({
        event_id: eventId,
        attendee_id: a.id,
        pdf_path: path,
        email: a.email,
        sent_at: new Date().toISOString(),
      });
      await resend.emails.send({
        from: "ADU Al Ain Events <onboarding@resend.dev>",
        to: a.email,
        subject: `Your certificate — ${evAny.title}`,
        html: `<p>Dear ${a.full_name},</p><p>Thank you for attending <strong>${evAny.title}</strong> at Abu Dhabi University — Al Ain Campus. Your certificate of attendance is attached.</p><p>Best regards,<br/>Al Ain Campus Events</p>`,
        attachments: [{ filename: "ADU-Certificate.pdf", content: Buffer.from(pdf) }],
      });
      sent++;
    } catch {
      skipped++;
    }
  }

  revalidatePath(`/admin/events/${eventId}/edit`);
  return { ok: true, sent, skipped };
}
