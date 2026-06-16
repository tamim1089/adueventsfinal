import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Server-only: NEVER import this from a
// Client Component or anything that reaches the browser bundle. Used for
// public self-registration (validated server-side) + certificate storage.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
