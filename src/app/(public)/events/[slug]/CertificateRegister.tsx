"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Download } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function CertificateRegister({ slug, title }: { slug: string; title: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function issue() {
    const res = await fetch("/api/certificate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name: name.trim(), email: email.trim() }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "Couldn't issue the certificate.");
    }
    const blob = await res.blob();
    downloadBlob(blob, `ADU-Certificate-${name.trim().replace(/\s+/g, "-")}.pdf`);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      await issue();
      setStatus("done");
      toast.success("You're registered — certificate downloaded");
    } catch (err) {
      setStatus("idle");
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-6 w-full rounded-full py-3.5 text-base font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.98]"
          style={{ background: "var(--accent)" }}
        >
          Register to attend
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80">
        {status === "done" ? (
          <div className="text-center">
            <BadgeCheck className="mx-auto text-[var(--accent)]" size={28} />
            <p className="mt-3 font-display text-lg font-semibold text-[var(--text-primary)]">
              You&apos;re registered.
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
              Your certificate of attendance has downloaded. Registering counts
              as attendance for certification.
            </p>
            <button
              type="button"
              onClick={() => issue().catch(() => toast.error("Couldn't download"))}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
            >
              <Download size={14} /> Download again
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <p className="font-display text-lg font-semibold leading-tight text-[var(--text-primary)]">
              Register &amp; get your certificate
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              Registering for <span dir="auto" className="font-medium">{title}</span> counts as
              attendance — your certificate is issued instantly.
            </p>

            <label htmlFor="cert-name" className="mt-4 block text-xs font-medium text-[var(--text-secondary)]">
              Full name
            </label>
            <Input
              id="cert-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="As it should appear on the certificate"
              required
              className="mt-1.5"
            />

            <label htmlFor="cert-email" className="mt-3 block text-xs font-medium text-[var(--text-secondary)]">
              Email
            </label>
            <Input
              id="cert-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              required
              className="mt-1.5"
            />

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-4 w-full rounded-full py-3 text-sm font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.98] disabled:opacity-70"
              style={{ background: "var(--accent)" }}
            >
              {status === "loading" ? "Issuing…" : "Register & download"}
            </button>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}
