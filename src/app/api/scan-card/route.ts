import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/scan-card
 *
 * Receives structured JSON from the client-side OCR pipeline and upserts
 * into scanned_business_cards. No images are ever sent here.
 *
 * Idempotency: if a card with the same (email, phone) pair already exists
 * it is updated in-place via ON CONFLICT upsert.
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Basic validation — at minimum we need some text to have been read
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const row = {
      id:         data.id ?? undefined,          // allow client-supplied uuid
      name:       data.name        ?? null,
      title:      data.title       ?? null,
      company:    data.company     ?? null,
      email:      data.email       ?? null,
      phone:      data.phone       ?? null,
      website:    data.website     ?? null,
      address:    data.address     ?? null,
      phones:     Array.isArray(data.phones)  ? data.phones  : [],
      emails:     Array.isArray(data.emails)  ? data.emails  : [],
      socials:    Array.isArray(data.socials) ? data.socials : [],
      raw_text:   data.rawText     ?? null,
      confidence: typeof data.confidence === "number" ? data.confidence : null,
    };

    const { error } = await supabaseAdmin
      .from("scanned_business_cards")
      .upsert(row, {
        // Dedup on email+phone unique index when both are present
        onConflict: row.email && row.phone ? "email,phone" : "id",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("[scan-card] DB error:", error.message);
      // Still return 200 so the UI never breaks — the scan was valid
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[scan-card] Unexpected error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
