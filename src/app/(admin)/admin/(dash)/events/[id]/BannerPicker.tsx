"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { setEventBanner } from "../../photos/actions";
import type { Photo } from "@/lib/admin/db";

export default function BannerPicker({
  photos,
  eventId,
  currentBannerPath,
}: {
  photos: Photo[];
  eventId: string;
  currentBannerPath: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function pick(p: Photo) {
    if (busy || p.path === currentBannerPath) return;
    setBusy(p.id);
    await setEventBanner(eventId, p.path);
    toast.success("Banner updated");
    router.refresh();
    setBusy(null);
  }

  return (
    <div>
      <p className="mb-3 text-sm text-[var(--text-tertiary)]">Click a photo to use it as the banner:</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {photos.map((p) => {
          const isActive = p.path === currentBannerPath;
          const isLoading = busy === p.id;
          return (
            <button
              key={p.id}
              onClick={() => pick(p)}
              disabled={!!busy}
              title={isActive ? "Current banner" : "Set as banner"}
              className={`group relative overflow-hidden rounded-[var(--r-lg)] border-2 transition-all ${
                isActive
                  ? "border-[var(--accent)]"
                  : "border-[var(--glass-border)] hover:border-[var(--accent)]/60"
              } ${isLoading ? "opacity-50" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption ?? ""}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
              {isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--accent)]/20">
                  <CheckCircle size={28} className="text-[var(--accent)] drop-shadow" />
                </div>
              )}
              {!isActive && (
                <div className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)]">
                    Set as banner
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
