"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface PartnershipTrackerItem {
  id: string;
  name: string;
  position: string | null;
  contact: string | null;
  notes: string | null;
  to_be_done: string | null;
  updates: string | null;
  created_at: string;
  updated_at: string;
}

export async function addPartnershipTracker(formData: FormData) {
  const name = formData.get("name") as string;
  const position = formData.get("position") as string;
  const contact = formData.get("contact") as string;
  const notes = formData.get("notes") as string;
  const to_be_done = formData.get("to_be_done") as string;
  const updates = formData.get("updates") as string;

  if (!name || !name.trim()) {
    return { error: "Name is required." };
  }

  const { error } = await supabaseAdmin.from("partnerships_tracker").insert({
    name: name.trim(),
    position: position?.trim() || null,
    contact: contact?.trim() || null,
    notes: notes?.trim() || null,
    to_be_done: to_be_done?.trim() || null,
    updates: updates?.trim() || null,
  });

  if (error) return { error: error.message };
  
  revalidatePath("/partnerships");
  return { success: true };
}

export async function updatePartnershipTracker(id: string, formData: FormData) {
  const updates: Record<string, string | null> = {
    name: (formData.get("name") as string)?.trim() || null,
    position: (formData.get("position") as string)?.trim() || null,
    contact: (formData.get("contact") as string)?.trim() || null,
    notes: (formData.get("notes") as string)?.trim() || null,
    to_be_done: (formData.get("to_be_done") as string)?.trim() || null,
    updates: (formData.get("updates") as string)?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  // Remove null/undefined values to avoid overwriting with null
  Object.keys(updates).forEach(key => {
    if (updates[key] === "" || updates[key] === null) {
      delete updates[key];
    }
  });

  // Ensure name is never empty if provided
  if (updates.name !== undefined && !updates.name) {
    return { error: "Name cannot be empty." };
  }

  const { error } = await supabaseAdmin
    .from("partnerships_tracker")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };
  
  revalidatePath("/partnerships");
  return { success: true };
}

export async function updatePartnershipTrackerNotes(id: string, notes: string) {
  const { error } = await supabaseAdmin
    .from("partnerships_tracker")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  
  revalidatePath("/partnerships");
  return { success: true };
}

export async function updatePartnershipTrackerUpdates(id: string, updates: string) {
  const { error } = await supabaseAdmin
    .from("partnerships_tracker")
    .update({ updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  
  revalidatePath("/partnerships");
  return { success: true };
}

export async function deletePartnershipTracker(id: string) {
  const { error } = await supabaseAdmin
    .from("partnerships_tracker")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  
  revalidatePath("/partnerships");
  return { success: true };
}