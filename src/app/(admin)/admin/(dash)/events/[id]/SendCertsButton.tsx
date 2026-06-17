"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { sendCertificates } from "./cert-actions";

export default function SendCertsButton({ eventId, disabled }: { eventId: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function go() {
    if (pending) return;
    setPending(true);
    const res = await sendCertificates(eventId);
    setPending(false);
    if (res.ok) {
      toast.success(`Sent ${res.sent} certificate${res.sent === 1 ? "" : "s"}${res.skipped ? ` · ${res.skipped} skipped` : ""}`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <button
      onClick={go}
      disabled={pending || disabled}
      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.97] disabled:opacity-60"
      style={{ background: "var(--accent)" }}
    >
      <BadgeCheck size={16} /> {pending ? "Sending…" : "Send certificates"}
    </button>
  );
}
