"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Copy,
  Mail,
  Phone,
  Globe,
  Building2,
  Building,
  GraduationCap,
  User,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  type Partner,
  type PartnerCategory,
  type PartnerContact,
  SHOW_FULL_SCHOOLS,
} from "@/lib/partnerships-data";

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";
const EASE = [0.2, 0.8, 0.2, 1] as const;

const GROUPS: { key: PartnerCategory; n: string; title: string; icon: LucideIcon }[] = [
  { key: "gov", n: "01", title: "Government", icon: Building2 },
  { key: "company", n: "02", title: "Corporate", icon: Building },
  { key: "school", n: "03", title: "Educational", icon: GraduationCap },
  { key: "individual", n: "04", title: "Individuals", icon: User },
];
const CATEGORY_LABEL: Record<PartnerCategory, string> = {
  gov: "Government",
  company: "Corporate",
  school: "School",
  individual: "Individual",
};

async function copy(text: string, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Couldn't copy");
  }
}
function contactBlock(p: Partner, c: PartnerContact) {
  return [p.name, c.name && `${c.name}${c.position ? ` — ${c.position}` : ""}`, ...c.emails, ...c.phones]
    .filter(Boolean)
    .join("\n");
}
function contactHrefs(email: string, partnerName: string) {
  const subject = encodeURIComponent(`ADU Al Ain Campus — Partnership: ${partnerName}`);
  const body = encodeURIComponent(
    `Dear ${partnerName} team,\n\nWriting from Abu Dhabi University, Al Ain Campus regarding our partnership.\n\nBest regards,\n`
  );
  return {
    mailto: `mailto:${email}?subject=${subject}&body=${body}`,
    outlookWeb: `https://outlook.office.com/mail/deeplink/compose?to=${email}&subject=${subject}&body=${body}`,
  };
}
const initial = (name: string) => ([...name.trim()][0] || "?").toUpperCase();

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function Chip({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        accent ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--glass-border)] text-[var(--text-tertiary)]"
      }`}
    >
      {children}
    </span>
  );
}

function ContactRow({ icon: Icon, value, href }: { icon: LucideIcon; value: string; href: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={13} className="shrink-0 text-[var(--text-tertiary)]" />
      <a href={href} className="truncate font-mono text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">
        {value}
      </a>
      <button
        type="button"
        aria-label={`Copy ${value}`}
        onClick={() => copy(value)}
        className="ml-auto shrink-0 rounded p-1 text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]"
      >
        <Copy size={13} />
      </button>
    </div>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="faux-glass card-hover group flex w-full items-center gap-3 p-4 text-left"
        >
          <Avatar>
            {partner.logo && <AvatarImage src={partner.logo} alt="" />}
            <AvatarFallback>{initial(partner.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span dir="auto" className="block truncate font-display text-base font-semibold leading-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
              {partner.name}
            </span>
            <span className="mt-0.5 block truncate text-xs font-medium text-[var(--text-tertiary)]">
              {partner.subtype || CATEGORY_LABEL[partner.category]} · {partner.contacts.length}{" "}
              {partner.contacts.length === 1 ? "contact" : "contacts"}
            </span>
          </span>
          {partner.mou && <Chip accent>MoU</Chip>}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80">
        <h3 dir="auto" className="font-display text-lg font-semibold leading-tight text-[var(--text-primary)]">
          {partner.name}
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip>{CATEGORY_LABEL[partner.category]}</Chip>
          {partner.mou && <Chip accent>MoU</Chip>}
          {partner.subtype && <Chip>{partner.subtype}</Chip>}
          {partner.status && <Chip>{partner.status}</Chip>}
        </div>

        <div className="mt-4 max-h-72 space-y-4 overflow-y-auto">
          {partner.contacts.map((c, i) => {
            const email = c.emails[0];
            const hrefs = email ? contactHrefs(email, partner.name) : null;
            return (
              <div key={i} className="border-t border-[var(--glass-border)] pt-3 first:border-0 first:pt-0">
                {c.name && (
                  <p dir="auto" className="text-sm font-semibold text-[var(--text-primary)]">
                    {c.name}
                  </p>
                )}
                {c.position && (
                  <p dir="auto" className="mt-0.5 text-xs font-medium text-[var(--text-tertiary)]">
                    {c.position}
                  </p>
                )}
                {(c.emails.length > 0 || c.phones.length > 0) && (
                  <div className="mt-2 space-y-1.5">
                    {c.emails.map((e) => (
                      <ContactRow key={e} icon={Mail} value={e} href={`mailto:${e}`} />
                    ))}
                    {c.phones.map((p) => (
                      <ContactRow key={p} icon={Phone} value={p} href={`tel:${p.replace(/\s/g, "")}`} />
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copy(contactBlock(partner, c), "Contact copied")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
                  >
                    <Copy size={12} /> Copy
                  </button>
                  {hrefs ? (
                    <a
                      href={hrefs.mailto}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.97]"
                      style={{ background: "var(--accent)" }}
                    >
                      <Mail size={12} /> Contact
                    </a>
                  ) : (
                    <span
                      title="No contact on file"
                      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text-tertiary)] opacity-60"
                      style={{ background: "var(--bg-subtle)" }}
                    >
                      <Mail size={12} /> Contact
                    </span>
                  )}
                  {hrefs && (
                    <a
                      href={hrefs.outlookWeb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[0.625rem] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]"
                    >
                      Outlook web <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {partner.website && (
          <a
            href={partner.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 border-t border-[var(--glass-border)] pt-3 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
          >
            <Globe size={13} /> Website
          </a>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function PartnerDirectory({ partners }: { partners: Partner[] }) {
  const visible = SHOW_FULL_SCHOOLS ? partners : partners.filter((p) => !(p.category === "school" && !p.mou));

  return (
    <>
      {GROUPS.map((g) => {
        const items = visible.filter((p) => p.category === g.key);
        if (items.length === 0) return null;
        const Icon = g.icon;
        return (
          <section key={g.key} className="border-b border-[var(--glass-border)] bg-[var(--bg-base)] even:bg-[var(--bg-subtle)]">
            <div className={`grid grid-cols-1 gap-10 py-20 sm:py-24 lg:grid-cols-12 ${EDGE}`}>
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-28">
                  <p className="text-sm font-medium text-[var(--text-tertiary)]">
                    {g.n} — {g.title}
                  </p>
                  <h2 className="mt-3 flex items-center gap-3 font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-[1.04] tracking-[-0.02em] text-[var(--text-primary)]">
                    <Icon size={26} strokeWidth={1.75} className="text-[var(--accent)]" />
                    {g.title}
                  </h2>
                  <p className="mt-4 font-mono text-xs tabular-nums text-[var(--text-tertiary)]">
                    {items.length} {items.length === 1 ? "partner" : "partners"}
                    {g.key === "school" ? " · MoU" : ""}
                  </p>
                </div>
              </div>

              <div
                className="grid gap-3 lg:col-span-8"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
              >
                {items.map((p, i) => (
                  <FadeUp key={p.id} delay={Math.min(i, 8) * 0.03}>
                    <PartnerCard partner={p} />
                  </FadeUp>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
