// Skeleton shown while the dashboard data loads.
// This runs immediately — no DB wait needed before the shell renders.
export default function DashLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-[var(--bg-subtle)]" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-[var(--bg-subtle)]" />
        ))}
      </div>
      <div className="h-6 w-32 rounded-lg bg-[var(--bg-subtle)]" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-[var(--bg-subtle)]" />
        ))}
      </div>
    </div>
  );
}
