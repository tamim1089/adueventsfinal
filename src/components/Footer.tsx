import Link from "next/link";
import { ORGANIZERS } from "@/lib/organizers";

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

const BROWSE = [
  { href: "/events", label: "Events" },
  { href: "/partnerships", label: "Partnerships & MoUs" },
  { href: "/#organizers", label: "Organizers" },
  { href: "/admin", label: "Organizer sign in" },
];

// A genuine stopping point: hairline-led, mono labels, editorial — not a link
// dump. The red appears at most once, on hover.
export default function Footer() {
  const orgIndex = ORGANIZERS.slice(0, 6);

  return (
    <footer className={`border-t border-[var(--glass-border)] bg-[var(--bg-base)] ${EDGE}`}>
      <div className="grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {/* wordmark + description */}
        <div className="lg:col-span-2">
          <span className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            ADU Events
          </span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--text-secondary)]">
            What&apos;s on across Abu Dhabi University — every college,
            department, and center, in one place.
          </p>
        </div>

        {/* browse */}
        <nav aria-label="Browse">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Browse
          </p>
          <ul className="mt-4 space-y-2.5">
            {BROWSE.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* organizers index */}
        <nav aria-label="Organizers">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Organizers
          </p>
          <ul className="mt-4 space-y-2.5">
            {orgIndex.map((o) => (
              <li key={o.slug}>
                <Link
                  href="/events"
                  className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
                >
                  {o.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 border-t border-[var(--glass-border)] py-8 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--text-tertiary)] sm:flex-row sm:items-center">
        <p>© {new Date().getFullYear()} Abu Dhabi University</p>
        <p>Part of the ADU Apps platform</p>
      </div>
    </footer>
  );
}
