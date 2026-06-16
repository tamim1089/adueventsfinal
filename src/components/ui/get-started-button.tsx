"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Animated CTA: the label fades while a chevron pill sweeps across the button.
// Lifts on hover; presses on active. Used for the hero actions.
export function GetStartedButton({
  href,
  label,
  variant = "primary",
  className,
}: {
  href: string;
  label: string;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const primary = variant === "primary";
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex h-12 select-none items-center overflow-hidden rounded-full pl-7 pr-2 text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]",
        primary
          ? "text-[var(--accent-on)] shadow-sm hover:shadow-lg"
          : "border border-white/35 text-white hover:border-white/60",
        className
      )}
      style={primary ? { background: "var(--accent)" } : undefined}
    >
      <span className="mr-12 transition-opacity duration-500 group-hover:opacity-0">{label}</span>
      <i
        className={cn(
          "absolute bottom-1 right-1 top-1 z-10 grid w-10 place-items-center rounded-full transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95",
          primary ? "bg-white/20" : "bg-white/15"
        )}
      >
        <ChevronRight size={18} strokeWidth={2.5} aria-hidden="true" />
      </i>
    </Link>
  );
}
