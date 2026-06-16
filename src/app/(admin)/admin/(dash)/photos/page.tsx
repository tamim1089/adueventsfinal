import { requireAdmin } from "@/lib/admin/db";

export const metadata = { title: "Photos" };

export default async function Photos() {
  const { sb } = await requireAdmin();
  const { count } = await sb.from("photos").select("id", { count: "exact", head: true });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Photos</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">Event galleries</h1>
      </div>
      <div className="sm:max-w-xs border border-[var(--glass-border)] p-6" style={{ borderRadius: "var(--r-xl)" }}>
        <p className="font-mono text-4xl font-semibold tabular-nums text-[var(--text-primary)]">{count ?? 0}</p>
        <p className="mt-1 text-xs font-medium text-[var(--text-tertiary)]">Photos uploaded</p>
      </div>
      <p className="max-w-2xl text-[var(--text-secondary)]">Upload post-event photos to the private <code className="rounded bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono text-xs">photos</code> bucket and attach them to an event. Upload UI is the next module.</p>
    </div>
  );
}
