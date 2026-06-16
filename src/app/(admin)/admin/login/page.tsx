import type { Metadata } from "next";
import Logo from "@/components/Logo";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

// Calm, premium sign-in. A centered card is the exception that earns a small
// constrained box — on warm paper, no cosmic/shader background.
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[var(--bg-base)] px-6 py-12">
      <div
        className="w-full max-w-md border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-8 sm:p-10"
        style={{ borderRadius: "var(--r-xl)" }}
      >
        <div className="flex items-center gap-3">
          <Logo size={30} priority />
          <div className="h-6 w-px bg-[var(--glass-border)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">ADU Events</span>
        </div>

        <h1 className="mt-7 font-display text-3xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          Organizer sign in
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Use your ADU Microsoft account, or an email invite. Access is scoped to
          your department.
        </p>

        <LoginForm />
      </div>
    </div>
  );
}
