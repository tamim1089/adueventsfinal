import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed `middleware` → `proxy`. Runs before routes render.
// Job: (1) refresh the Supabase session cookie, (2) gate /admin behind auth.
// RLS is the real protection; this is just a fast redirect for UX.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Not configured yet (public landing can still render). Skip auth.
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLogin = request.nextUrl.pathname === "/admin/login";

  if (isAdminRoute && !isLogin && !user) {
    const redirect = new URL("/admin/login", request.url);
    redirect.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  // Run on everything except static assets and the hero media.
  matcher: ["/((?!_next/static|_next/image|media|favicon.ico).*)"],
};
