"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarRange,
  ImageUp,
  BadgeCheck,
  MessageSquareText,
  Images,
  FileBarChart,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  CalendarRange,
  ImageUp,
  BadgeCheck,
  MessageSquareText,
  Images,
  FileBarChart,
};

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";
const EASE = [0.2, 0.8, 0.2, 1] as const;

type Feature = { title: string; body: string; iconName: string };

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingAnimations({ features }: { features: Feature[] }) {
  return (
    <section id="features" className="bg-[var(--bg-base)]">
      <FadeUp className={`pt-20 sm:pt-28 ${EDGE}`}>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">03 — For organizers</p>
        <h2 className="mt-3 max-w-2xl font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.04] tracking-[-0.02em] text-[var(--text-primary)]">
          From the poster to the report — handled.
        </h2>
      </FadeUp>
      <div className="mt-12 grid grid-cols-1 gap-px border-y border-[var(--glass-border)] bg-[var(--glass-border)] sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => {
          const Icon = ICON_MAP[f.iconName];
          return (
            <FadeUp
              key={f.title}
              delay={(i % 3) * 0.06}
              className="flex h-full flex-col bg-[var(--bg-base)] px-[clamp(1.25rem,4vw,5rem)] py-10 sm:px-8 lg:px-9"
            >
              <span className="font-mono text-sm tabular-nums text-[var(--text-tertiary)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              {Icon && (
                <Icon size={22} strokeWidth={1.75} className="mt-5 text-[var(--accent)]" aria-hidden="true" />
              )}
              <h3 className="mt-4 font-display text-xl font-semibold text-[var(--text-primary)]">{f.title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">{f.body}</p>
            </FadeUp>
          );
        })}
      </div>
    </section>
  );
}
