import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("scanned_business_cards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[scan-card] GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const row: Record<string, unknown> = {
      name: data.name ?? null,
      title: data.title ?? null,
      company: data.company ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      raw_text: data.rawText ?? null,
    };

    if (data.id) row.id = data.id;
    if (data.website) row.website = data.website;
    if (data.address) row.address = data.address;
    if (Array.isArray(data.phones) && data.phones.length) row.phones = data.phones;
    if (Array.isArray(data.emails) && data.emails.length) row.emails = data.emails;
    if (Array.isArray(data.socials) && data.socials.length) row.socials = data.socials;
    if (typeof data.confidence === "number") row.confidence = data.confidence;

    const { error } = await supabaseAdmin
      .from("scanned_business_cards")
      .upsert(row, { onConflict: "id" });

    if (error) {
      console.error("[scan-card] POST error:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[scan-card] Unexpected error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("scanned_business_cards")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[scan-card] DELETE error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[scan-card] DELETE error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
