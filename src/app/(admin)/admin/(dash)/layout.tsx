import { requireAdmin } from "@/lib/admin/db";
import AdminShell from "@/components/admin/AdminShell";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const { sb, user } = await requireAdmin();

  const nowIso = new Date().toISOString();
  const { data: upcoming } = await sb
    .from("events")
    .select("title, starts_at")
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(5);

  const notifications = (upcoming ?? []).map((e) => ({
    title: e.title as string,
    when: new Date(e.starts_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <AdminShell email={user.email ?? "organizer"} notifications={notifications}>
      {children}
    </AdminShell>
  );
}
