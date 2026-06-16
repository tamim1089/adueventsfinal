"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { saveEvent, type EventInput } from "@/app/(admin)/admin/actions";
import type { AdminEvent } from "@/lib/admin/db";

function toInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const labelCls = "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";
const fieldCls = "w-full rounded-[10px] border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]";

export default function EventForm({
  organizers,
  event,
}: {
  organizers: { id: string; name: string }[];
  event?: AdminEvent;
}) {
  const router = useRouter();
  const [f, setF] = useState({
    title: event?.title ?? "",
    organizer_id: event?.organizer_id ?? organizers[0]?.id ?? "",
    starts_at: toInput(event?.starts_at),
    ends_at: toInput(event?.ends_at),
    location: event?.location ?? "",
    audience: (event?.audience ?? "uni") as "uni" | "external",
    status: (event?.status ?? "draft") as "draft" | "published" | "archived",
    description: event?.description ?? "",
    certificate_description: event?.certificate_description ?? "",
    contact_hours: event?.contact_hours ?? "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const res = await saveEvent({ id: event?.id, ...f } as EventInput);
    if (res.ok) {
      router.push("/admin/events");
      router.refresh();
    } else {
      setError(res.error);
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <div>
        <label className={labelCls}>Title</label>
        <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Event title" required />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Organizer</label>
          <select className={fieldCls} value={f.organizer_id} onChange={(e) => set("organizer_id", e.target.value)}>
            {organizers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Venue</label>
          <Input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Auditorium A" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Starts</label>
          <input type="datetime-local" className={fieldCls} value={f.starts_at} onChange={(e) => set("starts_at", e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Ends</label>
          <input type="datetime-local" className={fieldCls} value={f.ends_at} onChange={(e) => set("ends_at", e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Audience</label>
          <select className={fieldCls} value={f.audience} onChange={(e) => set("audience", e.target.value)}>
            <option value="uni">University (students/staff)</option>
            <option value="external">External (schools / public)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={fieldCls} value={f.status} onChange={(e) => set("status", e.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea className={`${fieldCls} min-h-24`} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What's the event about?" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Certificate line</label>
          <textarea className={`${fieldCls} min-h-20`} value={f.certificate_description} onChange={(e) => set("certificate_description", e.target.value)} placeholder="Text under the recipient name on the certificate (optional)" />
        </div>
        <div>
          <label className={labelCls}>Contact hours</label>
          <Input value={f.contact_hours} onChange={(e) => set("contact_hours", e.target.value)} placeholder="e.g. 2 contact hours" />
        </div>
      </div>

      {error && <p role="alert" className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={pending} className="rounded-full px-6 py-3 text-sm font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.98] disabled:opacity-60" style={{ background: "var(--accent)" }}>
          {pending ? "Saving…" : event ? "Save changes" : "Create event"}
        </button>
        <button type="button" onClick={() => router.push("/admin/events")} className="rounded-full border border-[var(--glass-border)] px-6 py-3 text-sm font-medium text-[var(--text-primary)]">
          Cancel
        </button>
      </div>
    </form>
  );
}
