import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { storeMsTokens } from "@/lib/graph/send-mail";

// OAuth (Microsoft/Google) and magic-link callback: exchange the code for a
// session cookie, then continue to the originally requested page.
// Also captures the Microsoft provider_token/provider_refresh_token (if present)
// and stores them in encrypted httpOnly cookies for Graph API calls.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Store Microsoft OAuth tokens in secure cookies so server actions can
      // call the Graph API to send emails without prompting the user again.
      const at = data.session?.provider_token;
      const rt = data.session?.provider_refresh_token;
      if (at) await storeMsTokens(at, rt ?? null);

      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/admin/login?error=auth`);
}
