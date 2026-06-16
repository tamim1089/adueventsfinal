import { requireAdmin } from "@/lib/admin/db";

export const metadata = { title: "Surveys" };

export default async function Surveys() {
  const { sb } = await requireAdmin();
  const { count } = await sb.from("surveys").select("id", { count: "exact", head: true });
  const { count: responses } = await sb.from("survey_responses").select("id", { count: "exact", head: true });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Surveys</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">Post-event feedback</h1>
      </div>
      <div className="grid grid-cols-2 gap-px border border-[var(--glass-border)] bg-[var(--glass-border)] sm:max-w-md" style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}>
        <div className="bg-[var(--bg-base)] p-6"><p className="font-mono text-4xl font-semibold tabular-nums text-[var(--text-primary)]">{count ?? 0}</p><p className="mt-1 text-xs font-medium text-[var(--text-tertiary)]">Surveys</p></div>
        <div className="bg-[var(--bg-base)] p-6"><p className="font-mono text-4xl font-semibold tabular-nums text-[var(--text-primary)]">{responses ?? 0}</p><p className="mt-1 text-xs font-medium text-[var(--text-tertiary)]">Responses</p></div>
      </div>
      <p className="max-w-2xl text-[var(--text-secondary)]">Attach a feedback survey to any event and collect responses. The survey builder is the next module.</p>
    </div>
  );
}
