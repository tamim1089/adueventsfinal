import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// We use the service role key here to bypass RLS for inserting,
// or we can just use anon key and rely on an INSERT-only RLS policy on the table.
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      console.warn("Supabase not configured, skipping DB insert.");
      return NextResponse.json({ success: true, warning: "Supabase not configured." });
    }

    const supabase = createClient(url, key);
    
    // Insert into the scanned_business_cards table. 
    // Requires an INSERT-only RLS policy in Supabase.
    const { error } = await supabase
      .from("scanned_business_cards")
      .insert({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        title: data.title,
        raw_text: data.rawText
      });

    if (error) {
      console.error("Failed to insert scanned card:", error);
      // We still return 200 so the UI doesn't break, just logged the error for admin.
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
