"use client";

import { useState } from "react";
import { Mail, Phone, Plus } from "lucide-react";
import type { Partner } from "@/lib/partnerships-data";

const FREE = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "live.com", "aol.com", "emirates.net.ae"]);

function domainOf(p: Partner): string | null {
  for (const c of p.contacts) for (const e of c.emails) {
    const d = e.split("@")[1]?.toLowerCase();
    if (d && !FREE.has(d)) return d;
  }
  return null;
}
const initials = (s: string) => s.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

type Card = { partner: Partner; domain: string; emails: string[]; phones: string[] };

function LogoCell({ card }: { card: Card }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="group relative flex aspect-[3/2] items-center justify-center border-b border-r border-[var(--glass-border)] bg-[var(--bg-base)] p-6">
      <Plus className="pointer-events-none absolute -bottom-[9px] -right-[9px] z-10 size-4 text-[var(--glass-border)]" strokeWidth={1.5} />
      {broken ? (
        <span className="font-display text-2xl font-bold text-[var(--text-tertiary)]">{initials(card.partner.name)}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://logo.clearbit.com/${card.domain}`}
          alt={card.partner.name}
          className="max-h-10 w-auto max-w-[78%] object-contain opacity-80 transition-opacity group-hover:opacity-100"
          onError={() => setBroken(true)}
          loading="lazy"
        />
      )}

      {/* hover contact card */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-60 -translate-x-1/2 translate-y-1 border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4 opacity-0 shadow-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100" style={{ borderRadius: "var(--r-lg)" }}>
        <p className="font-display text-sm font-semibold leading-tight text-[var(--text-primary)]">{card.partner.name}</p>
        <div className="mt-2 space-y-1.5">
          {card.emails.slice(0, 1).map((e) => (
            <a key={e} href={`mailto:${e}`} className="pointer-events-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]">
              <Mail size={12} className="shrink-0 text-[var(--accent)]" /> <span className="truncate">{e}</span>
            </a>
          ))}
          {card.phones.slice(0, 1).map((ph) => (
            <a key={ph} href={`tel:${ph.replace(/\s/g, "")}`} className="pointer-events-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]">
              <Phone size={12} className="shrink-0 text-[var(--accent)]" /> {ph}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PartnerLogoCloud({ partners }: { partners: Partner[] }) {
  const cards: Card[] = partners
    .filter((p) => (p.category === "company" || p.category === "gov") && /[A-Za-z]/.test(p.name))
    .map((p) => {
      const domain = domainOf(p);
      if (!domain) return null;
      const emails = p.contacts.flatMap((c) => c.emails);
      const phones = p.contacts.flatMap((c) => c.phones);
      return { partner: p, domain, emails, phones };
    })
    .filter(Boolean) as Card[];

  // de-dupe by domain, keep a clean count
  const seen = new Set<string>();
  const unique = cards.filter((c) => (seen.has(c.domain) ? false : (seen.add(c.domain), true)));

  if (unique.length === 0) return null;

  return (
    <div className="grid grid-cols-2 border-l border-t border-[var(--glass-border)] sm:grid-cols-3 lg:grid-cols-5">
      {unique.map((c) => (
        <LogoCell key={c.domain} card={c} />
      ))}
    </div>
  );
}
