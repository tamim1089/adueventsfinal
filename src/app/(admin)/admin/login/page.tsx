import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

// Premium split: a campus brand panel on the left, the form on warm paper on
// the right. A back-to-home button sits top-center over both panels.
export default function AdminLoginPage() {
  return (
    <div className="relative grid min-h-[100svh] lg:grid-cols-2">
      <Link
        href="/"
        className="absolute left-1/2 top-5 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm font-medium text-[var(--text-primary)] shadow-sm backdrop-blur transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        <ArrowLeft size={15} /> Back to home
      </Link>

      {/* brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <Image
          src="/media/unifront.jpg"
          alt="Abu Dhabi University campus"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(155deg, rgba(16,12,10,0.55) 0%, rgba(16,12,10,0.50) 45%, rgba(16,12,10,0.88) 100%)" }}
        />
        <span className="pointer-events-none absolute -left-16 bottom-24 h-72 w-72 rounded-full border border-white/10" aria-hidden="true" />

        <div className="relative z-10">
          <span className="inline-flex rounded-2xl bg-white/95 p-3 shadow-lg">
            <Image src="/brand/adu-logo.png" alt="Abu Dhabi University" width={2243} height={1680} priority className="h-14 w-auto object-contain" />
          </span>
        </div>

        <div className="relative z-10">
          <p className="text-sm font-medium text-[var(--accent)]">Organizer workspace</p>
          <h2 className="mt-4 max-w-md font-display text-[clamp(2rem,3.5vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.02em] text-white">
            Publish, track, and document every ADU event.
          </h2>
          <p className="mt-4 max-w-sm leading-relaxed text-white/70">
            One workspace for posters, attendance, certificates, surveys, and
            reports — across every college and center.
          </p>
        </div>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center bg-[var(--bg-base)] px-6 py-20 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 lg:hidden">
            <Logo size={28} priority />
            <span className="text-sm font-semibold text-[var(--text-primary)]">ADU Events</span>
          </div>

          <h1 className="mt-8 font-display text-[clamp(2rem,5vw,2.75rem)] font-bold tracking-[-0.02em] text-[var(--text-primary)] lg:mt-0">
            Organizer sign in
          </h1>
          <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
            Use your ADU Microsoft account, or an email invite. Access is scoped
            to your department.
          </p>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
