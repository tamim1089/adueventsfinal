"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper, { type Area } from "react-easy-crop";
import { Upload, X, ImageUp } from "lucide-react";
import { toast } from "sonner";
import { uploadBanner } from "../../photos/actions";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function exportCropped(src: string, area: Area, maxSide = 1920): Promise<Blob> {
  const img = await loadImage(src);
  const scale = Math.min(1, maxSide / Math.max(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width * scale));
  canvas.height = Math.max(1, Math.round(area.height * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.92));
}

const ASPECTS = [
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "Free", value: undefined },
] as const;

export default function BannerUpload({ eventId }: { eventId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result as string);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  async function doUpload() {
    if (!src || !area || busy) return;
    setBusy(true);
    try {
      const blob = await exportCropped(src, area);
      const fd = new FormData();
      fd.append("eventId", eventId);
      fd.append("file", new File([blob], "banner.jpg", { type: "image/jpeg" }));
      const res = await uploadBanner(fd);
      if (res.ok) {
        toast.success("Banner uploaded ✓");
        setSrc(null);
        router.refresh();
      } else {
        toast.error(res.error || "Upload failed");
      }
    } catch {
      toast.error("Couldn't process the image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />

      <button
        onClick={() => fileRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        <ImageUp size={15} />
        Upload banner image
      </button>

      {/* Crop modal */}
      {src && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--r-xl)] bg-[var(--bg-base)] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Crop banner</h3>
                <p className="text-xs text-[var(--text-tertiary)]">16:9 is recommended for best display</p>
              </div>
              <button
                onClick={() => setSrc(null)}
                className="rounded-full p-2 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-subtle)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Crop area */}
            <div className="relative h-[52vh] bg-black">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, px) => setArea(px)}
              />
            </div>

            {/* Controls */}
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                {ASPECTS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => setAspect(a.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      aspect === a.value
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
                <label className="ml-auto flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                  Zoom
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="accent-[var(--accent)]"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setSrc(null)}
                  className="rounded-full border border-[var(--glass-border)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-subtle)]"
                >
                  Cancel
                </button>
                <button
                  onClick={doUpload}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--accent-on)] disabled:opacity-60"
                  style={{ background: "var(--accent)" }}
                >
                  <Upload size={15} />
                  {busy ? "Uploading…" : "Set as banner"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
