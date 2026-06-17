"use client";

import { useState } from "react";
import { Mail, Phone, Building2, Building, GraduationCap, type LucideIcon } from "lucide-react";
import { type Partner, type PartnerCategory, SHOW_FULL_SCHOOLS } from "@/lib/partnerships-data";

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";
const FREE = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "live.com", "aol.com", "emirates.net.ae"]);

const GROUPS: { key: PartnerCategory; n: string; title: string; icon: LucideIcon }[] = [
  { key: "gov", n: "01", title: "Government", icon: Building2 },
  { key: "company", n: "02", title: "Corporate", icon: Building },
  { key: "school", n: "03", title: "Educational", icon: GraduationCap },
];

function domainOf(p: Partner): string | null {
  for (const c of p.contacts) for (const e of c.emails) {
    const d = e.split("@")[1]?.toLowerCase();
    if (d && !FREE.has(d)) return d;
  }
  return null;
}
const initials = (s: string) => s.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function Tile({ partner }: { partner: Partner }) {
  const domain = domainOf(partner);
  const [noIcon, setNoIcon] = useState(!domain);
  const email = partner.contacts.flatMap((c) => c.emails)[0];
  const phone = partner.contacts.flatMap((c) => c.phones)[0];

  return (
    <div className="card-hover flex flex-col items-center gap-3 border border-[var(--glass-border)] bg-[var(--bg-base)] p-5 text-center" style={{ borderRadius: "var(--r-lg)" }}>
      {noIcon ? (
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--bg-subtle)] font-display text-xl font-bold text-[var(--text-secondary)]">{initials(partner.name)}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 rounded-xl object-contain"
          onError={() => setNoIcon(true)}
          loading="lazy"
        />
      )}

      <span dir="auto" className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug text-[var(--text-primary)]">{partner.name}</span>

      <div className="mt-auto w-full space-y-1 pt-1">
        {email && (
          <a href={`mailto:${email}`} className="flex items-center justify-center gap-1.5 text-[0.7rem] text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]">
            <Mail size={11} className="shrink-0" /> <span className="truncate">{email}</span>
          </a>
        )}
        {phone && (
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center justify-center gap-1.5 text-[0.7rem] text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]">
            <Phone size={11} className="shrink-0" /> {phone}
          </a>
        )}
      </div>
    </div>
  );
}

export default function PartnerDirectory({ partners }: { partners: Partner[] }) {
  const visible = SHOW_FULL_SCHOOLS ? partners : partners.filter((p) => !(p.category === "school" && !p.mou));

  return (
    <>
      {GROUPS.map((g) => {
        const items = visible
          .filter((p) => p.category === g.key)
          // tiles with a real logo/domain first
          .sort((a, b) => (domainOf(b) ? 1 : 0) - (domainOf(a) ? 1 : 0) || a.name.localeCompare(b.name));
        if (items.length === 0) return null;
        const Icon = g.icon;
        return (
          <section key={g.key} className="border-b border-[var(--glass-border)] bg-[var(--bg-base)] even:bg-[var(--bg-subtle)]">
            <div className={`py-16 sm:py-20 ${EDGE}`}>
              <p className="text-sm font-medium text-[var(--text-tertiary)]">{g.n} — {g.title}</p>
              <h2 className="mt-3 flex items-center gap-3 font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-[1.04] tracking-[-0.02em] text-[var(--text-primary)]">
                <Icon size={26} strokeWidth={1.75} className="text-[var(--accent)]" />
                {g.title}
                <span className="text-base font-normal text-[var(--text-tertiary)]">· {items.length}</span>
              </h2>
              <div className="mt-8 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
                {items.map((p) => (
                  <Tile key={p.id} partner={p} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
