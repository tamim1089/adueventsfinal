"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegisterInput = {
  eventId: string;
  kind: "uni" | "school";
  fullName: string;
  email: string;
  uniId?: string;
  position?: string;
  schoolId?: string;
  grade?: string;
};

export async function registerForEvent(
  input: RegisterInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const fullName = input.fullName?.trim();
  const email = input.email?.trim().toLowerCase();
  if (!fullName) return { ok: false, error: "Please enter your full name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email." };

  if (input.kind === "uni") {
    if (!input.uniId?.trim()) return { ok: false, error: "Please enter your ADU ID." };
    if (!input.position?.trim()) return { ok: false, error: "Please pick your role." };
  } else {
    if (!input.schoolId) return { ok: false, error: "Please pick your school." };
    if (!input.grade?.trim()) return { ok: false, error: "Please enter your grade." };
  }

  // Event must exist and be published.
  const { data: ev } = await supabaseAdmin
    .from("events")
    .select("id, status")
    .eq("id", input.eventId)
    .maybeSingle();
  if (!ev || ev.status !== "published") return { ok: false, error: "Registration is closed for this event." };

  const row = {
    event_id: input.eventId,
    full_name: fullName,
    email,
    audience: input.kind === "uni" ? "uni" : "external",
    uni_id: input.kind === "uni" ? input.uniId!.trim() : null,
    position: input.kind === "uni" ? input.position!.trim() : null,
    school_id: input.kind === "school" ? input.schoolId! : null,
    grade: input.kind === "school" ? input.grade!.trim() : null,
    registered_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from("attendees").insert(row);
  if (error) {
    if (error.code === "23505") return { ok: true }; // already registered — idempotent
    return { ok: false, error: "Couldn't complete registration. Please try again." };
  }

  // refresh the live attendance count (best-effort)
  const { count } = await supabaseAdmin
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .eq("event_id", input.eventId);
  if (typeof count === "number") {
    await supabaseAdmin.from("events").update({ attending: count }).eq("id", input.eventId);
  }

  return { ok: true };
}
