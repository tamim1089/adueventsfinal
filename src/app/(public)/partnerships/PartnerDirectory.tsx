"use client";

import { useMemo, useState } from "react";
import { Mail, Phone, Building2, Building, GraduationCap, Check, Send, X, type LucideIcon } from "lucide-react";
import { type Partner, type PartnerCategory, SHOW_FULL_SCHOOLS } from "@/lib/partnerships-data";
import { useIsOrganizer } from "@/lib/useViewer";

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
const firstEmail = (p: Partner): string | null => p.contacts.flatMap((c) => c.emails)[0] ?? null;
const initials = (s: string) => s.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function Tile({
  partner,
  selectable,
  selected,
  onToggle,
}: {
  partner: Partner;
  selectable: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const domain = domainOf(partner);
  const [noIcon, setNoIcon] = useState(!domain);
  const email = partner.contacts.flatMap((c) => c.emails)[0];
  const phone = partner.contacts.flatMap((c) => c.phones)[0];
  const canSelect = selectable && !!email;

  return (
    <div
      className={`relative flex flex-col items-center gap-3 border bg-[var(--bg-base)] p-5 text-center transition-colors ${selected ? "border-[var(--accent)] ring-1 ring-[var(--accent)]" : "card-hover border-[var(--glass-border)]"}`}
      style={{ borderRadius: "var(--r-lg)" }}
    >
      {canSelect && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={selected ? "Deselect" : "Select for email"}
          className={`absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full border transition-colors ${selected ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--glass-border)] bg-[var(--bg-base)] text-transparent hover:border-[var(--accent)]"}`}
        >
          <Check size={13} strokeWidth={3} />
        </button>
      )}

      {noIcon ? (
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--bg-subtle)] font-display text-xl font-bold text-[var(--text-secondary)]">{initials(partner.name)}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} alt="" width={56} height={56} className="h-14 w-14 rounded-xl object-contain" onError={() => setNoIcon(true)} loading="lazy" />
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
  const isOrganizer = useIsOrganizer();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visible = SHOW_FULL_SCHOOLS ? partners : partners.filter((p) => !(p.category === "school" && !p.mou));
  const emailable = useMemo(() => visible.filter((p) => firstEmail(p)), [visible]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  const selectAll = () => setSelected(new Set(emailable.map((p) => p.id)));
  const clear = () => setSelected(new Set());

  function sendEmail() {
    const emails = Array.from(
      new Set(emailable.filter((p) => selected.has(p.id)).map((p) => firstEmail(p)!).filter(Boolean))
    );
    if (emails.length === 0) return;
    const subject = encodeURIComponent("Abu Dhabi University — Al Ain Campus");
    const body = encodeURIComponent("Dear partner,\n\n\n\nBest regards,\nAbu Dhabi University — Al Ain Campus");
    // Outlook on the web — recipients in BCC (keeps the list private for a group send)
    const url = `https://outlook.office.com/mail/deeplink/compose?bcc=${encodeURIComponent(emails.join(";"))}&subject=${subject}&body=${body}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {isOrganizer && (
        <div className={`sticky top-[4.75rem] z-30 border-b border-[var(--glass-border)] bg-[var(--bg-base)]/95 py-3 backdrop-blur ${EDGE}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {selected.size > 0 ? `${selected.size} selected` : "Select partners to email"}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">· {emailable.length} have an email</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button onClick={selectAll} className="rounded-full border border-[var(--glass-border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]">Select all</button>
              {selected.size > 0 && (
                <button onClick={clear} className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)]"><X size={12} /> Clear</button>
              )}
              <button onClick={sendEmail} disabled={selected.size === 0} className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.97] disabled:opacity-50" style={{ background: "var(--accent)" }}>
                <Send size={13} /> Email {selected.size > 0 ? `(${selected.size})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {GROUPS.map((g) => {
        const items = visible
          .filter((p) => p.category === g.key)
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
                  <Tile key={p.id} partner={p} selectable={isOrganizer} selected={selected.has(p.id)} onToggle={() => toggle(p.id)} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
