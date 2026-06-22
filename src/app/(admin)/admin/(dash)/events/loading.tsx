export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 rounded-lg bg-[var(--bg-subtle)]" />
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[var(--bg-subtle)]" />
        ))}
      </div>
    </div>
  );
}
