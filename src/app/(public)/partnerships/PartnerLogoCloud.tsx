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
  const [noIcon, setNoIcon] = useState(!card.domain);
  return (
    <div className="group relative flex aspect-[3/2] flex-col items-center justify-center gap-2.5 border-b border-r border-[var(--glass-border)] bg-[var(--bg-base)] p-5 transition-colors hover:bg-[var(--bg-subtle)]">
      <Plus className="pointer-events-none absolute -bottom-[9px] -right-[9px] z-10 size-4 text-[var(--glass-border)]" strokeWidth={1.5} />
      {noIcon ? (
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--bg-subtle)] font-display text-sm font-bold text-[var(--text-secondary)]">{initials(card.partner.name)}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?domain=${card.domain}&sz=64`}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 object-contain opacity-90 transition-opacity group-hover:opacity-100"
          onError={() => setNoIcon(true)}
          loading="lazy"
        />
      )}
      <span dir="auto" className="line-clamp-2 px-1 text-center font-display text-[0.9375rem] font-semibold leading-tight text-[var(--text-primary)]">
        {card.partner.name}
      </span>

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
  const seen = new Set<string>();
  const unique: Card[] = partners
    .filter((p) => (p.category === "company" || p.category === "gov") && /[A-Za-z]/.test(p.name))
    .map((p) => ({
      partner: p,
      domain: domainOf(p) ?? "",
      emails: p.contacts.flatMap((c) => c.emails),
      phones: p.contacts.flatMap((c) => c.phones),
    }))
    .filter((c) => (seen.has(c.partner.id) ? false : (seen.add(c.partner.id), true)));

  if (unique.length === 0) return null;

  return (
    <div className="grid grid-cols-2 border-l border-t border-[var(--glass-border)] sm:grid-cols-3 lg:grid-cols-5">
      {unique.map((c) => (
        <LogoCell key={c.partner.id} card={c} />
      ))}
    </div>
  );
}
