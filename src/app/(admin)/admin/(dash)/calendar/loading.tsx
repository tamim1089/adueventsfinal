export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-36 rounded-lg bg-[var(--bg-subtle)]" />
      <div className="h-64 rounded-2xl bg-[var(--bg-subtle)]" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-[var(--bg-subtle)]" />
        ))}
      </div>
    </div>
  );
}
