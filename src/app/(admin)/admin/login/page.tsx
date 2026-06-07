import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6">
      <div className="blob blob-a -left-20 top-10 h-80 w-80" style={{ background: "var(--accent)" }} />
      <div className="blob blob-b -right-20 bottom-0 h-96 w-96" style={{ background: "var(--brand-navy)" }} />

      <div className="glass w-full max-w-sm p-8">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-[10px] font-display text-lg font-bold text-[var(--accent-on)]"
            style={{ background: "var(--accent)" }}
          >
            A
          </span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Al Ain Campus Events
          </span>
        </div>

        <h1 className="mt-7 font-display text-3xl font-semibold text-[var(--text-primary)]">
          Organizer sign in
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Access is scoped to your department. Contact campus IT for an account.
        </p>

        <LoginForm />
      </div>
    </div>
  );
}
