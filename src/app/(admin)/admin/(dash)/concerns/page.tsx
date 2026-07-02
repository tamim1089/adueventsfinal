import { requireAdmin } from "@/lib/admin/db";
import ClientConcerns from "./ClientConcerns";

export const metadata = { title: "Student Concerns" };

export default async function ConcernsPage() {
  const { sb } = await requireAdmin();

  // Fetch existing concerns
  const { data } = await sb
    .from("student_concerns")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Manage</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          Student Concerns
        </h1>
      </div>
      
      {/* Client component handles the state, UI, and interactions */}
      <ClientConcerns initialConcerns={data || []} />
    </div>
  );
}
