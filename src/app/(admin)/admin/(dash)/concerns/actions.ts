"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addConcern(formData: FormData) {
  const sb = await createClient();
  const name = formData.get("name") as string;
  const student_id = formData.get("student_id") as string;
  const phone_number = formData.get("phone_number") as string;
  const email = formData.get("email") as string;
  const concern = formData.get("concern") as string;

  if (!name || !student_id || !phone_number || !concern) {
    return { error: "Please fill all required fields." };
  }

  const { error } = await sb.from("student_concerns").insert({
    name,
    student_id,
    phone_number,
    email,
    concern,
  });

  if (error) return { error: error.message };
  
  revalidatePath("/admin/concerns");
  return { success: true };
}

export async function updateConcernNotes(id: string, updates: string) {
  const sb = await createClient();
  
  const { error } = await sb
    .from("student_concerns")
    .update({ updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  
  revalidatePath("/admin/concerns");
  return { success: true };
}
