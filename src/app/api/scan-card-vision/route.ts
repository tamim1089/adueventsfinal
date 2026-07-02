import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { OpenRouterVisionProvider } from "@/lib/vision/providers/openrouter";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { image, mimeType } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Missing or invalid base64 image" }, { status: 400 });
    }

    const buffer = Buffer.from(image, "base64");
    const provider = new OpenRouterVisionProvider();
    const card = await provider.extractBusinessCard(buffer, mimeType ?? "image/jpeg");

    const name = card.fullName ?? "Unknown";
    const primaryEmail = card.emails[0] ?? null;
    const primaryPhone = card.phones[0] ?? null;

    const { data: inserted, error } = await supabaseAdmin
      .from("scanned_business_cards")
      .insert({
        name,
        title: card.jobTitle,
        company: card.company,
        email: primaryEmail,
        phone: primaryPhone,
        website: card.website,
        address: card.address,
        phones: card.phones,
        emails: card.emails,
        socials: card.linkedin ? [card.linkedin] : [],
        confidence: 0.9,
      })
      .select()
      .single();

    if (error) {
      console.error("[scan-card-vision] insert error:", error.message);
      return NextResponse.json({ error: "Failed to save card" }, { status: 500 });
    }

    return NextResponse.json({
      id: inserted.id,
      name: inserted.name,
      email: inserted.email,
      phone: inserted.phone,
      company: inserted.company,
      title: inserted.title,
      website: inserted.website,
      address: inserted.address,
      phones: inserted.phones,
      emails: inserted.emails,
      socials: inserted.socials,
      rawText: "",
      confidence: inserted.confidence ?? 0.9,
    });
  } catch (err) {
    console.error("[scan-card-vision] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
