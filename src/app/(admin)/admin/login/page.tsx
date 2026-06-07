import type { Metadata } from "next";
import Logo from "@/components/Logo";
import LoginForm from "./LoginForm";
import { CosmicParallaxBg } from "@/components/ui/parallax-cosmic-background";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-black px-6 py-12">
      {/* cosmic parallax background (ADU black + red) */}
      <div className="absolute inset-0 -z-10">
        <CosmicParallaxBg head="" text="" loop />
      </div>

      <div className="w-full max-w-md rounded-[24px] border border-black/5 bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <Logo size={30} priority />
          <div className="h-6 w-px bg-[var(--glass-border)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            ADU Events
          </span>
        </div>

        <h1 className="mt-7 font-display text-3xl font-bold text-[var(--text-primary)]">
          Organizer sign in
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Use your ADU Microsoft account, or an email invite. Access is scoped to your department.
        </p>

        <LoginForm />
      </div>
    </div>
  );
}
