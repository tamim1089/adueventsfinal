"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Client-side check: is the current visitor a signed-in organizer/admin?
// Used to reveal edit affordances on public pages without forcing SSR.
export function useIsOrganizer(): boolean {
  const [isOrganizer, setIsOrganizer] = useState(false);
  useEffect(() => {
    let active = true;
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      if (active) setIsOrganizer(!!data.user);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (active) setIsOrganizer(!!session?.user);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);
  return isOrganizer;
}
