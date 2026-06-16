import Link from "next/link";
import { ArrowRight } from "lucide-react";

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

// Editorial 404 — full-bleed warm canvas, big serif, mono sub-line. Not a
// centered white box.
export default function NotFound() {
  return (
    <main className={`flex min-h-screen flex-col justify-center bg-[var(--bg-base)] py-32 ${EDGE}`}>
      <p className="text-sm font-medium text-[var(--accent)]">
        Error 404
      </p>
      <h1 className="mt-5 font-display text-[clamp(3rem,12vw,9rem)] font-bold leading-[0.9] tracking-[-0.03em] text-[var(--text-primary)]">
        This page isn&apos;t
        <br />
        on the schedule.
      </h1>
      <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--text-secondary)]">
        The page you&apos;re looking for has ended, moved, or never took place.
        Head back to what&apos;s on.
      </p>
      <Link
        href="/events"
        className="mt-9 inline-flex w-fit items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.98]"
        style={{ background: "var(--accent)" }}
      >
        Browse events <ArrowRight size={17} />
      </Link>
    </main>
  );
}
