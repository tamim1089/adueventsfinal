"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const inputCls =
  "w-full rounded-[12px] border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors focus:border-[var(--accent)] focus:bg-white";

const oauthBtn =
  "flex w-full items-center justify-center gap-2.5 rounded-[12px] border border-[var(--glass-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]";

export default function LoginForm() {
  const router = useRouter();
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
      if (error) return setError(error.message);
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Sign-in isn't configured yet. Add Supabase keys to .env.local.");
    } finally {
      setPending(false);
    }
  }

  async function oauth(provider: "azure" | "google") {
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
          // Azure: request the basic profile + email
          scopes: provider === "azure" ? "email openid profile" : undefined,
        },
      });
      if (error) setError(error.message);
    } catch {
      setError("Single sign-on isn't configured yet. Add Supabase keys + the provider.");
    }
  }

  return (
    <div className="mt-7 space-y-3">
      {/* Microsoft (primary SSO for ADU staff) */}
      <button type="button" onClick={() => oauth("azure")} className={oauthBtn}>
        <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true">
          <path fill="#f25022" d="M1 1h10v10H1z" />
          <path fill="#7fba00" d="M12 1h10v10H12z" />
          <path fill="#00a4ef" d="M1 12h10v10H1z" />
          <path fill="#ffb900" d="M12 12h10v10H12z" />
        </svg>
        Continue with Microsoft
      </button>

      <button type="button" onClick={() => oauth("google")} className={oauthBtn}>
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
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
