"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, CalendarDays } from "lucide-react";

function useDebounce<T>(value: T, delay: number = 200): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export interface Action {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  short?: string;
  end?: string;
  href?: string;
}

interface ActionSearchBarProps {
  actions: Action[];
  label?: string;
  placeholder?: string;
  onSelect?: (action: Action) => void;
}

export function ActionSearchBar({
  actions,
  label = "Search",
  placeholder = "Search…",
  onSelect,
}: ActionSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 180);

  // Derive results during render (no setState-in-effect).
  const results = useMemo<Action[] | null>(() => {
    if (!isFocused) return null;
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return actions;
    return actions.filter((a) =>
      `${a.label} ${a.description ?? ""} ${a.end ?? ""}`.toLowerCase().includes(q)
    );
  }, [debouncedQuery, isFocused, actions]);

  const container = {
    hidden: { opacity: 0, y: -8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: [0.2, 0.8, 0.2, 1] as const, staggerChildren: 0.04 },
    },
    exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
  };
  const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  };

  const pick = (a: Action) => {
    setQuery("");
    setIsFocused(false);
    onSelect?.(a);
  };

  return (
    <div className="relative w-full">
      <label htmlFor="event-search" className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Input
          id="event-search"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 180)}
          className="h-11 rounded-full pl-5 pr-11"
        />
        <div className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]">
          <AnimatePresence mode="popLayout">
            {query.length > 0 ? (
              <motion.div key="send" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.18 }}>
                <Send className="h-4 w-4 text-[var(--accent)]" />
              </motion.div>
            ) : (
              <motion.div key="search" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.18 }}>
                <Search className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isFocused && results && (
          <motion.div
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden border border-[var(--glass-border)] bg-[var(--bg-elevated)] shadow-[var(--glass-shadow-lg)]"
            style={{ borderRadius: "var(--r-xl)" }}
            variants={container}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {results.length > 0 ? (
              <motion.ul className="max-h-[22rem] overflow-y-auto py-1.5">
                {results.map((a) => (
                  <motion.li
                    key={a.id}
                    className="mx-1.5 flex cursor-pointer items-center justify-between gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-[var(--bg-subtle)]"
                    variants={item}
                    layout
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(a)}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="shrink-0 text-[var(--accent)]">
                        {a.icon ?? <CalendarDays className="h-4 w-4" />}
                      </span>
                      <span className="truncate text-sm font-medium text-[var(--text-primary)]">{a.label}</span>
                      {a.description && (
                        <span className="hidden truncate text-xs font-medium text-[var(--text-tertiary)] sm:inline">
                          {a.description}
                        </span>
                      )}
                    </span>
                    {a.end && (
                      <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-[var(--text-secondary)]">
                        {a.end}
                      </span>
                    )}
                  </motion.li>
                ))}
              </motion.ul>
            ) : (
              <div className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
                No events match “{query}”.
              </div>
            )}
            <div className="border-t border-[var(--glass-border)] px-4 py-2.5 text-xs text-[var(--text-tertiary)]">
              Press Enter to jump · Esc to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
