import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BusinessCard } from "@/lib/vision/types";

export interface ScannedCardRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  website: string | null;
  address: string | null;
  phones: string[];
  emails: string[];
  socials: string[];
  raw_text: string | null;
  confidence: number | null;
}

export async function createContact(
  card: BusinessCard,
  confidence?: number,
  rawText?: string,
): Promise<{ id: string } | { error: string }> {
  const id = crypto.randomUUID();

  const row: Record<string, unknown> = {
    id,
    name: card.fullName ?? "Unknown",
    title: card.jobTitle ?? null,
    company: card.company ?? null,
    email: card.emails[0] ?? null,
    phone: card.phones[0] ?? null,
    raw_text: rawText ?? null,
  };

  const { error } = await supabaseAdmin
    .from("scanned_business_cards")
    .insert(row);

  if (error) {
    console.error("[create-contact] DB error:", error.message);
    return { error: error.message };
  }

  return { id };
}

export function businessCardToScannedCard(
  card: BusinessCard,
  confidence?: number,
  rawText?: string,
): ScannedCardRow {
  return {
    id: crypto.randomUUID(),
    name: card.fullName ?? "Unknown",
    email: card.emails[0] ?? null,
    phone: card.phones[0] ?? null,
    company: card.company ?? null,
    title: card.jobTitle ?? null,
    website: card.website ?? null,
    address: card.address ?? null,
    phones: card.phones,
    emails: card.emails,
    socials: card.linkedin ? [card.linkedin] : [],
    raw_text: rawText ?? null,
    confidence: confidence ?? null,
  };
}
