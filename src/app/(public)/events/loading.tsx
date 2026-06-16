const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

// Skeleton matching the events grid — not a spinner.
export default function EventsLoading() {
  return (
    <section className={`pb-24 pt-28 ${EDGE}`}>
      <div className="border-b border-[var(--glass-border)] pb-8">
        <div className="h-3 w-40 animate-pulse rounded bg-[var(--bg-subtle)]" />
        <div className="mt-4 h-14 w-56 animate-pulse rounded bg-[var(--bg-subtle)]" />
      </div>

      <div className="grid grid-cols-1 gap-10 pt-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden flex-col gap-3 lg:flex">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 w-36 animate-pulse rounded bg-[var(--bg-subtle)]" />
          ))}
        </aside>

        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="faux-glass overflow-hidden">
              <div className="aspect-[16/10] w-full animate-pulse bg-[var(--bg-subtle)]" />
              <div className="flex flex-col gap-3 p-5">
                <div className="h-2.5 w-24 animate-pulse rounded bg-[var(--bg-subtle)]" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-[var(--bg-subtle)]" />
                <div className="h-4 w-full animate-pulse rounded bg-[var(--bg-subtle)]" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[var(--bg-subtle)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
