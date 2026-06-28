"use client";

import { useMemo, useState } from "react";
import { Mail, Phone, Building2, Building, GraduationCap, Check, Send, X, Copy, Camera, type LucideIcon } from "lucide-react";
import BusinessCardScanner, { type ScannedCard } from "./BusinessCardScanner";
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
      onClick={canSelect ? onToggle : undefined}
      role={canSelect ? "button" : undefined}
      aria-pressed={canSelect ? selected : undefined}
      className={`relative flex flex-col items-center gap-3 border bg-[var(--bg-base)] p-5 text-center transition-colors ${canSelect ? "cursor-pointer" : ""} ${selected ? "border-[var(--accent)] ring-1 ring-[var(--accent)]" : "card-hover border-[var(--glass-border)]"}`}
      style={{ borderRadius: "var(--r-lg)" }}
    >
      {canSelect && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full border transition-colors ${selected ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--glass-border)] bg-[var(--bg-base)] text-transparent"}`}
        >
          <Check size={13} strokeWidth={3} />
        </span>
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
          <a href={`mailto:${email}`} onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-1.5 text-[0.7rem] text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]">
            <Mail size={11} className="shrink-0" /> <span className="truncate">{email}</span>
          </a>
        )}
        {phone && (
          <a href={`tel:${phone.replace(/\s/g, "")}`} onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-1.5 text-[0.7rem] text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]">
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
  const [copied, setCopied] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedCards, setScannedCards] = useState<ScannedCard[]>([]);

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
  const setCategory = (items: Partner[], on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      items.forEach((p) => {
        if (!firstEmail(p)) return;
        if (on) n.add(p.id); else n.delete(p.id);
      });
      return n;
    });

  function selectedEmails() {
    return Array.from(new Set(emailable.filter((p) => selected.has(p.id)).map((p) => firstEmail(p)!).filter(Boolean)));
  }

  function sendEmail() {
    const emails = selectedEmails();
    if (emails.length === 0) return;
    const subject = encodeURIComponent("Abu Dhabi University — Al Ain Campus");
    const body = encodeURIComponent("Dear partner,\n\n\n\nBest regards,\nAbu Dhabi University — Al Ain Campus");
    // Outlook web deeplink only fills `to`, comma-separated (it ignores bcc/cc).
    const to = emails.map(encodeURIComponent).join(",");
    const url = `https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${subject}&body=${body}`;
    // open a sized compose popup, not the full-screen mailbox tab
    const w = 760, h = 880;
    const left = Math.max(0, (window.screen.width - w) / 2);
    const top = Math.max(0, (window.screen.height - h) / 2);
    window.open(url, "adu-compose", `width=${w},height=${h},left=${left},top=${top}`);
  }

  async function copyEmails() {
    const emails = selectedEmails();
    if (emails.length === 0) return;
    try { await navigator.clipboard.writeText(emails.join(", ")); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
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
              {selected.size > 0 && (
                <button onClick={copyEmails} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]">
                  <Copy size={12} /> {copied ? "Copied!" : "Copy emails"}
                </button>
              )}
              <button onClick={sendEmail} disabled={selected.size === 0} className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.97] disabled:opacity-50" style={{ background: "var(--accent)" }}>
                <Send size={13} /> Email {selected.size > 0 ? `(${selected.size})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Scanner Section */}
      <section className="border-b border-[var(--glass-border)] bg-[var(--bg-base)]">
        <div className={`py-16 sm:py-20 ${EDGE}`}>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-[var(--accent)]">Action — Digitize</p>
              <h2 className="mt-3 flex items-center gap-3 font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-[1.04] tracking-[-0.02em] text-[var(--text-primary)]">
                <Camera size={26} strokeWidth={1.75} className="text-[var(--accent)]" />
                Scanned Cards
                {scannedCards.length > 0 && (
                  <span className="text-base font-normal text-[var(--text-tertiary)]">· {scannedCards.length}</span>
                )}
              </h2>
              <p className="mt-3 max-w-xl text-lg text-[var(--text-secondary)]">
                Securely digitize physical cards using on-device OCR. Data is instantly synced to your database.
              </p>
            </div>
            <button
              onClick={() => setScannerOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 font-semibold text-[var(--accent-on)] shadow-sm transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ background: "var(--accent)" }}
            >
              <Camera size={18} /> Scan Business Card
            </button>
          </div>

          {/* Scanned Cards Grid (only shows if there are scanned cards) */}
          {scannedCards.length > 0 && (
            <div className="mt-12">
              <div className="mb-6 flex items-center justify-between border-b border-[var(--glass-border)] pb-4">
                <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">Recently Scanned</h3>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--accent)]">
                  {scannedCards.length} Session Cards
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {scannedCards.map((card) => (
                  <div key={card.id} className="card-hover relative flex flex-col gap-3 rounded-[var(--r-xl)] border border-[var(--glass-border)] bg-[var(--bg-base)] p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--bg-subtle)] font-display text-xl font-bold text-[var(--accent)]">
                        {card.name ? card.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div>
                        <h4 className="font-bold leading-tight text-[var(--text-primary)]">{card.name || "Unknown Name"}</h4>
                        {card.title && <p className="text-xs font-medium text-[var(--text-tertiary)]">{card.title}</p>}
                      </div>
                    </div>
                    {card.company && (
                      <div className="mt-2 inline-flex w-fit items-center rounded bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                        <Building size={12} className="mr-1.5 opacity-70" /> {card.company}
                      </div>
                    )}
                    <div className="mt-auto pt-4 space-y-2 border-t border-[var(--glass-border)]">
                      {card.email && (
                        <a href={`mailto:${card.email}`} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">
                          <Mail size={14} className="text-[var(--accent)] opacity-80" /> <span className="truncate">{card.email}</span>
                        </a>
                      )}
                      {card.phone && (
                        <a href={`tel:${card.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">
                          <Phone size={14} className="text-[var(--accent)] opacity-80" /> {card.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {scannerOpen && (
        <BusinessCardScanner
          onClose={() => setScannerOpen(false)}
          onScan={(card) => setScannedCards((prev) => [card, ...prev])}
        />
      )}

      {GROUPS.map((g) => {
        const items = visible
          .filter((p) => p.category === g.key)
          .sort((a, b) => (domainOf(b) ? 1 : 0) - (domainOf(a) ? 1 : 0) || a.name.localeCompare(b.name));
        if (items.length === 0) return null;
        const Icon = g.icon;
        const groupEmailable = items.filter((p) => firstEmail(p));
        const allSel = groupEmailable.length > 0 && groupEmailable.every((p) => selected.has(p.id));
        return (
          <section key={g.key} className="border-b border-[var(--glass-border)] bg-[var(--bg-base)] even:bg-[var(--bg-subtle)]">
            <div className={`py-16 sm:py-20 ${EDGE}`}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-tertiary)]">{g.n} — {g.title}</p>
                  <h2 className="mt-3 flex items-center gap-3 font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-[1.04] tracking-[-0.02em] text-[var(--text-primary)]">
                    <Icon size={26} strokeWidth={1.75} className="text-[var(--accent)]" />
                    {g.title}
                    <span className="text-base font-normal text-[var(--text-tertiary)]">· {items.length}</span>
                  </h2>
                </div>
                {isOrganizer && groupEmailable.length > 0 && (
                  <button
                    onClick={() => setCategory(groupEmailable, !allSel)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${allSel ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--glass-border)] text-[var(--text-primary)] hover:border-[var(--accent)]"}`}
                  >
                    <Check size={14} /> {allSel ? `Deselect ${g.title}` : `Select all ${g.title}`} ({groupEmailable.length})
                  </button>
                )}
              </div>
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
