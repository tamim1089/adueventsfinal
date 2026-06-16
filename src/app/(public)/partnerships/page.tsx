import type { Metadata } from "next";
import { Globe, Mail, ArrowRight, type LucideIcon, Building2, Building, GraduationCap } from "lucide-react";
import { PARTNERS_DATA, type Partner } from "@/lib/partnerships-data";

export const metadata: Metadata = {
  title: "Partnerships & MoUs",
  description: "ADU's partnerships with government, industry, and academic institutions.",
};

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

const GROUPS: { key: Partner["type"]; n: string; title: string; description: string; icon: LucideIcon }[] = [
  {
    key: "gov",
    n: "01",
    title: "Government",
    description: "Strategic alliances with national and local government bodies, aligning our academic mission with the UAE's vision.",
    icon: Building2,
  },
  {
    key: "company",
    n: "02",
    title: "Corporate",
    description: "Industry leaders collaborating on research, internships, and technology transfer between academia and the professional world.",
    icon: Building,
  },
  {
    key: "school",
    n: "03",
    title: "Educational",
    description: "Schools and universities working with us to foster a seamless educational journey and academic exchange.",
    icon: GraduationCap,
  },
];

function PartnerRow({ partner }: { partner: Partner }) {
  return (
    <li>
      <div className="group grid grid-cols-1 gap-3 border-t border-[var(--glass-border)] py-6 last:border-b sm:grid-cols-[1fr_auto] sm:items-start sm:gap-8">
        <div>
          <h3 className="font-display text-xl font-semibold leading-tight text-[var(--text-primary)] sm:text-2xl">
            {partner.name}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
            {partner.description}
          </p>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
          <a
            href={`mailto:${partner.email}`}
            className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]"
          >
            <Mail size={13} /> {partner.email}
          </a>
          {partner.website && (
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]"
              aria-label={`Visit ${partner.name} website`}
            >
              <Globe size={13} /> Website
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

export default function PartnershipsPage() {
  return (
    <>
      {/* intro band */}
      <section className={`border-b border-[var(--glass-border)] bg-[var(--bg-base)] pb-16 pt-28 sm:pb-20 ${EDGE}`}>
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
          Abu Dhabi University
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-[var(--text-primary)]">
          Partnerships &amp; MoUs.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
          ADU works closely with leading government entities, global corporations,
          and academic institutions to create opportunities for our students and
          drive innovation.
        </p>
      </section>

      {/* groups */}
      {GROUPS.map((g) => {
        const partners = PARTNERS_DATA.filter((p) => p.type === g.key);
        if (partners.length === 0) return null;
        const Icon = g.icon;
        return (
          <section key={g.key} className="border-b border-[var(--glass-border)] bg-[var(--bg-base)] even:bg-[var(--bg-subtle)]">
            <div className={`grid grid-cols-1 gap-12 py-20 sm:py-24 lg:grid-cols-12 ${EDGE}`}>
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-28">
                  <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                    {g.n} — {g.title}
                  </p>
                  <h2 className="mt-3 flex items-center gap-3 font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-[1.04] tracking-[-0.02em] text-[var(--text-primary)]">
                    <Icon size={26} strokeWidth={1.75} className="text-[var(--accent)]" />
                    {g.title}
                  </h2>
                  <p className="mt-4 max-w-xs text-[var(--text-secondary)]">{g.description}</p>
                </div>
              </div>
              <ul className="lg:col-span-8">
                {partners.map((p) => (
                  <PartnerRow key={p.id} partner={p} />
                ))}
              </ul>
            </div>
          </section>
        );
      })}

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
