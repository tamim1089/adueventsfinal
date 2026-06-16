import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { PARTNERS_DATA } from "@/lib/partnerships-data";
import PartnerDirectory from "./PartnerDirectory";

export const metadata: Metadata = {
  title: "Partners & MoUs",
  description: "ADU Al Ain Campus partners — government, corporate, educational, and individual, with MoUs.",
};

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

export default function PartnershipsPage() {
  // Individuals are excluded from the public directory.
  const partners = PARTNERS_DATA.filter((p) => p.category !== "individual");
  const total = partners.length;

  return (
    <>
      {/* intro band */}
      <section className={`border-b border-[var(--glass-border)] bg-[var(--bg-base)] pb-16 pt-28 sm:pb-20 ${EDGE}`}>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">
          Abu Dhabi University · Al Ain Campus
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-[var(--text-primary)]">
          Partners &amp; MoUs.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
          Government entities, corporations, schools, and individuals who work
          with ADU. Open any partner to copy their contacts or reach out
          directly.
        </p>
        <p className="mt-6 text-sm font-medium text-[var(--text-tertiary)]">
          {total} partners on file
        </p>
      </section>

      {/* interactive directory */}
      <PartnerDirectory partners={partners} />

      {/* CTA band */}
      <section
        className={`py-24 sm:py-32 ${EDGE}`}
        style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)" }}
      >
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="max-w-xl font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.04] tracking-[-0.02em] text-white">
              Interested in partnering with ADU?
            </h2>
            <p className="mt-4 max-w-md text-white/85">
              We&apos;re always expanding our network of strategic partners. Reach
              out to our External Relations office to discuss collaborations.
            </p>
          </div>
          <a
            href="mailto:partnerships@adu.ac.ae"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[var(--accent-strong)] transition-transform active:scale-[0.98]"
          >
            Contact External Relations <ArrowRight size={17} />
          </a>
        </div>
      </section>
    </>
  );
}
