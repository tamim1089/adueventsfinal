import Link from "next/link";
import Image from "next/image";
import { Globe, Mail, Phone, MapPin } from "lucide-react";
import { ORGANIZERS } from "@/lib/organizers";
import { GoesOutComesInUnderline, CenterUnderline } from "@/components/ui/underline-animation";

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

// Brand glyphs as inline SVG — this lucide build ships no brand icons.
const IconInstagram = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
const IconX = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.59l-4.6-6.01L6.5 22H3.24l8.02-9.17L2 2h6.76l4.16 5.5L18.244 2Zm-1.16 18h1.83L7.01 3.9H5.05L17.084 20Z" />
  </svg>
);
const IconLinkedIn = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 18.5v-8H5.67v8h2.67Zm-1.33-9.1a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1ZM18.5 18.5v-4.4c0-2.35-1.26-3.45-2.93-3.45-1.35 0-1.96.74-2.3 1.26v-1.08h-2.67v8h2.67v-4.46c0-.24.02-.47.09-.64.18-.47.62-.96 1.34-.96.94 0 1.32.72 1.32 1.78v4.28h2.68Z" />
  </svg>
);
const IconYouTube = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M23 12s0-3.2-.4-4.74a2.5 2.5 0 0 0-1.76-1.77C19.29 5.1 12 5.1 12 5.1s-7.29 0-8.84.39A2.5 2.5 0 0 0 1.4 7.26C1 8.8 1 12 1 12s0 3.2.4 4.74a2.5 2.5 0 0 0 1.76 1.77c1.55.39 8.84.39 8.84.39s7.29 0 8.84-.39a2.5 2.5 0 0 0 1.76-1.77C23 15.2 23 12 23 12ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
  </svg>
);

const socialLinks = [
  { Icon: Globe, label: "Website", href: "https://www.adu.ac.ae" },
  { Icon: IconInstagram, label: "Instagram", href: "https://www.instagram.com/abudhabiuni" },
  { Icon: IconX, label: "X", href: "https://x.com/abudhabiuni" },
  { Icon: IconLinkedIn, label: "LinkedIn", href: "https://www.linkedin.com/school/abu-dhabi-university/" },
  { Icon: IconYouTube, label: "YouTube", href: "https://www.youtube.com/@AbuDhabiUni" },
];

const browseLinks = [
  { text: "Events", href: "/events" },
  { text: "Partnerships & MoUs", href: "/partnerships" },
  { text: "Organizers", href: "/#organizers" },
  { text: "Organizer sign in", href: "/admin" },
];

const contactInfo = [
  { Icon: Mail, text: "events@adu.ac.ae", href: "mailto:events@adu.ac.ae", dir: "left" as const },
  { Icon: Phone, text: "+971 2 501 5555", href: "tel:+97125015555", dir: "right" as const },
];

export default function Footer() {
  const orgIndex = ORGANIZERS.slice(0, 6);

  return (
    <footer className={`border-t border-[var(--glass-border)] bg-[var(--bg-subtle)] ${EDGE}`}>
      <div className="grid grid-cols-1 gap-12 pb-10 pt-16 lg:grid-cols-3 lg:gap-8 lg:pt-20">
        {/* brand + social */}
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/brand/ADU_Logo.png"
              alt="Abu Dhabi University"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              ADU Events
            </span>
          </div>

          <p className="mt-5 max-w-xs leading-relaxed text-[var(--text-secondary)]">
            What&apos;s on across Abu Dhabi University — every college,
            department, and center, in one place.
          </p>

          <ul className="mt-7 flex items-center gap-5">
            {socialLinks.map(({ Icon, label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]"
                >
                  <span className="sr-only">{label}</span>
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-2">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Browse</p>
            <ul className="mt-5 space-y-3">
              {browseLinks.map(({ text, href }) => (
                <li key={text}>
                  <Link
                    href={href}
                    className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
                  >
                    <CenterUnderline label={text} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Organizers</p>
            <ul className="mt-5 space-y-3">
              {orgIndex.map((o) => (
                <li key={o.slug}>
                  <Link
                    href="/events"
                    className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
                  >
                    <CenterUnderline label={o.name} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Contact</p>
            <ul className="mt-5 space-y-3">
              {contactInfo.map(({ Icon, text, href, dir }) => (
                <li key={text}>
                  <a
                    href={href}
                    className="flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
                  >
                    <Icon className="size-4 shrink-0 text-[var(--accent)]" />
                    <GoesOutComesInUnderline label={text} direction={dir} />
                  </a>
                </li>
              ))}
              <li>
                <address className="flex items-start gap-2 text-sm not-italic text-[var(--text-secondary)]">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                  Abu Dhabi · Al Ain · Dubai, UAE
                </address>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* bottom bar — body font, no mono */}
      <div className="flex flex-col items-start justify-between gap-3 border-t border-[var(--glass-border)] py-8 text-sm text-[var(--text-tertiary)] sm:flex-row sm:items-center">
        <p>© {new Date().getFullYear()} Abu Dhabi University</p>
        <p>All rights reserved.</p>
      </div>
    </footer>
  );
}
