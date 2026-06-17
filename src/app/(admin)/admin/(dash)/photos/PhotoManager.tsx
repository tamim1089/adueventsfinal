"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper, { type Area } from "react-easy-crop";
import { Upload, Trash2, Star, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { uploadPhoto, deletePhoto, setEventBanner } from "./actions";
import type { Photo } from "@/lib/admin/db";

type Ev = { id: string; title: string };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
async function exportCropped(src: string, area: Area, maxSide = 1600): Promise<Blob> {
  const img = await loadImage(src);
  const scale = Math.min(1, maxSide / Math.max(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width * scale));
  canvas.height = Math.max(1, Math.round(area.height * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.9));
}

const ASPECTS: { label: string; value: number | undefined }[] = [
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
  { label: "Free", value: undefined },
];

export default function PhotoManager({ events, photos, lockedEventId }: { events: Ev[]; photos: Photo[]; lockedEventId?: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState(lockedEventId ?? events[0]?.id ?? "");
  const [src, setSrc] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const titleOf = (id: string) => events.find((e) => e.id === id)?.title ?? "Unassigned";

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!target) { toast.error("Pick an event first."); return; }
    const reader = new FileReader();
    reader.onload = () => { setSrc(reader.result as string); setZoom(1); setCrop({ x: 0, y: 0 }); };
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  async function doUpload() {
    if (!src || !area || !target || busy) return;
    setBusy(true);
    try {
      const blob = await exportCropped(src, area);
      const fd = new FormData();
      fd.append("eventId", target);
      fd.append("caption", caption);
      fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      const res = await uploadPhoto(fd);
      if (res.ok) { toast.success("Photo uploaded"); setSrc(null); setCaption(""); router.refresh(); }
      else toast.error(res.error || "Upload failed");
    } catch {
      toast.error("Couldn't process the image");
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Photo) {
    await deletePhoto(p.id, p.path);
    toast.success("Deleted");
    router.refresh();
  }
  async function makeBanner(p: Photo) {
    await setEventBanner(p.event_id, p.path);
    toast.success("Set as event banner");
    router.refresh();
  }

  const groups = events.map((e) => ({ ev: e, items: photos.filter((p) => p.event_id === e.id) })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-10">
      {/* upload bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-[var(--r-xl)] border border-[var(--glass-border)] bg-[var(--bg-subtle)] p-4">
        {!lockedEventId && (
          <>
            <span className="text-sm font-medium text-[var(--text-secondary)]">Upload to</span>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="rounded-[10px] border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
        <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--accent-on)]" style={{ background: "var(--accent)" }}>
          <ImagePlus size={16} /> Add photo
        </button>
        <span className="text-xs text-[var(--text-tertiary)]">Crop &amp; resize before upload.</span>
      </div>

      {/* galleries */}
      {groups.length === 0 ? (
        <div className="rounded-[var(--r-xl)] border border-dashed border-[var(--glass-border)] p-12 text-center text-[var(--text-secondary)]">
          No photos yet. Pick an event and add one.
        </div>
      ) : (
        groups.map(({ ev, items }) => (
          <section key={ev.id}>
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">{ev.title} <span className="text-sm font-normal text-[var(--text-tertiary)]">· {items.length}</span></h2>
            <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
              {items.map((p) => (
                <div key={p.id} className="group relative aspect-[4/3] overflow-hidden rounded-[var(--r-lg)] border border-[var(--glass-border)] bg-[var(--bg-subtle)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.caption ?? ""} className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => makeBanner(p)} title="Set as event banner" className="rounded-full bg-white/90 p-2 text-[var(--text-primary)] hover:text-[var(--accent)]"><Star size={14} /></button>
                    <button onClick={() => remove(p)} title="Delete" className="rounded-full bg-white/90 p-2 text-[var(--danger)]"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* crop modal */}
      {src && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--r-xl)] bg-[var(--bg-base)]">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-3">
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Crop &amp; resize</h3>
              <button onClick={() => setSrc(null)} className="rounded-full p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)]"><X size={18} /></button>
            </div>

            <div className="relative h-[55vh] bg-black">
              <Cropper image={src} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setArea(px)} />
            </div>

            <div className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                {ASPECTS.map((a) => (
                  <button key={a.label} onClick={() => setAspect(a.value)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${aspect === a.value ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--glass-border)] text-[var(--text-secondary)]"}`}>{a.label}</button>
                ))}
                <label className="ml-auto flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                  Zoom
                  <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="accent-[var(--accent)]" />
                </label>
              </div>
              <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" className="w-full rounded-[10px] border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setSrc(null)} className="rounded-full border border-[var(--glass-border)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)]">Cancel</button>
                <button onClick={doUpload} disabled={busy} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--accent-on)] disabled:opacity-60" style={{ background: "var(--accent)" }}>
                  <Upload size={15} /> {busy ? "Uploading…" : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
