"use client";

import Image from "next/image";
import { Building2, GraduationCap, Building, Mail, Globe, LucideIcon } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import { PARTNERS_DATA, type Partner } from "@/lib/partnerships-data";

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <Reveal>
      <div className="faux-glass card-hover group flex h-full flex-col p-6 transition-all duration-300">
        <div className="flex items-start justify-between">
          <div 
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}
          >
            {partner.type === 'gov' && <Building2 size={24} />}
            {partner.type === 'company' && <Building size={24} />}
            {partner.type === 'school' && <GraduationCap size={24} />}
          </div>
          
          {partner.website && (
            <a 
              href={partner.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
              aria-label={`Visit ${partner.name} website`}
            >
              <Globe size={18} />
            </a>
          )}
        </div>

        <h3 className="mt-5 font-display text-xl font-semibold leading-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
          {partner.name}
        </h3>
        
        <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
          {partner.description}
        </p>

        <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-[var(--glass-border)]">
          <a 
            href={`mailto:${partner.email}`}
            className="flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
          >
            <Mail size={14} />
            {partner.email}
          </a>
        </div>
      </div>
    </Reveal>
  );
}

function Section({ title, description, partners, icon: Icon }: { 
  title: string; 
  description: string; 
  partners: Partner[];
  icon: LucideIcon;
}) {
  if (partners.length === 0) return null;

  return (
    <section className="space-y-8">
      <Reveal>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--accent)]">
              <Icon size={20} />
            </div>
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              {title}
            </h2>
          </div>
          <p className="max-w-2xl text-[var(--text-secondary)] text-sm">
            {description}
          </p>
        </div>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((p) => (
          <PartnerCard key={p.id} partner={p} />
        ))}
      </div>
    </section>
  );
}

export default function PartnershipsPage() {
  const govPartners = PARTNERS_DATA.filter(p => p.type === 'gov');
  const companyPartners = PARTNERS_DATA.filter(p => p.type === 'company');
  const schoolPartners = PARTNERS_DATA.filter(p => p.type === 'school');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-28 sm:pt-32 pb-24 w-full">
      {/* Header */}
      <Reveal className="mb-16">
        <div className="max-w-3xl">
          <Image
            src="/brand/adu-logo-transparent.png"
            alt="Abu Dhabi University"
            width={120}
            height={40}
            className="mb-8 h-10 w-auto object-contain"
            priority
          />
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[var(--text-primary)]">
            Partnerships
          </h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)] leading-relaxed">
            Abu Dhabi University works closely with leading government entities, global corporations, 
            and academic institutions to create opportunities for our students and drive innovation.
          </p>
        </div>
      </Reveal>

      <div className="space-y-24">
        <Section 
          title="Government Organizations" 
          description="Strategic alliances with national and local government bodies to align our academic mission with the UAE's vision."
          partners={govPartners}
          icon={Building2}
        />

        <Section 
          title="Corporate Partners" 
          description="Industry leaders collaborating on research, internships, and technology transfer to bridge the gap between academia and the professional world."
          partners={companyPartners}
          icon={Building}
        />

        <Section 
          title="Educational Institutions" 
          description="Collaborations with schools and universities to foster a seamless educational journey and academic exchange."
          partners={schoolPartners}
          icon={GraduationCap}
        />
      </div>

      {/* Footer CTA */}
      <Reveal className="mt-24">
        <div className="faux-glass p-8 sm:p-12 rounded-[28px] text-center border border-[var(--accent-soft)] bg-[var(--accent-soft)]/5">
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Interested in partnering with ADU?
          </h2>
          <p className="mt-3 mx-auto max-w-lg text-[var(--text-secondary)]">
            We are always looking to expand our network of strategic partners. Reach out to our 
            External Relations office to discuss potential collaborations.
          </p>
          <div className="mt-8">
            <a 
              href="mailto:partnerships@adu.ac.ae"
              className="inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold text-[var(--accent-on)] shadow-lg transition-transform active:scale-[0.97]"
              style={{ background: "var(--accent)" }}
            >
              Contact External Relations
            </a>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
