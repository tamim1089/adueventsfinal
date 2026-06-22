"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const inputCls =
  "w-full rounded-[10px] border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors focus:border-[var(--accent)] focus:bg-[var(--bg-elevated)]";

const oauthBtn =
  "flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setPending(false);
        return;
      }
      // Hard navigate — avoids the router.replace + router.refresh() race
      // condition that required going back to the home page to pick up the session.
      window.location.href = "/admin";
    } catch {
      setError("Sign-in isn't configured yet. Add Supabase keys to .env.local.");
      setPending(false);
    }
  }

  async function oauthMicrosoft() {
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
          scopes: "email openid profile offline_access Mail.Send",
        },
      });
      if (error) setError(error.message);
    } catch {
      setError("Single sign-on isn't configured yet. Add Supabase keys + the provider.");
    }
  }

  return (
    <div className="mt-7 space-y-3">
      {/* Microsoft SSO — primary for ADU staff */}
      <button type="button" onClick={oauthMicrosoft} className={oauthBtn}>
        <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true">
          <path fill="#f25022" d="M1 1h10v10H1z" />
          <path fill="#7fba00" d="M12 1h10v10H12z" />
          <path fill="#00a4ef" d="M1 12h10v10H1z" />
          <path fill="#ffb900" d="M12 12h10v10H12z" />
        </svg>
        Continue with Microsoft
      </button>

      <div className="relative flex items-center py-2">
        <div className="grow border-t border-[var(--glass-border)]" />
        <span className="mx-4 text-xs text-[var(--text-tertiary)]">or with email</span>
        <div className="grow border-t border-[var(--glass-border)]" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm text-[var(--text-secondary)]">Email</label>
          <input id="email" type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="name@adu.ac.ae" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm text-[var(--text-secondary)]">Password</label>
          <div className="relative">
            <input id="password" type={showPw ? "text" : "password"} autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pr-11`} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-tertiary)]"
              aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p role="alert" className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

        <button type="submit" disabled={pending}
          className="h-12 w-full rounded-[12px] text-base font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.98] disabled:opacity-60"
          style={{ background: "var(--accent)" }}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
