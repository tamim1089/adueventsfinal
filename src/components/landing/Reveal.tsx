"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Scroll-reveal via IntersectionObserver — purely additive.
// Content is NEVER hidden by default: it only starts hidden when we've
// confirmed JS is running AND motion is allowed. Under Reduce Motion, no
// IO support, or before hydration, content is fully visible. (Legibility wins.)
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // armed = we intend to animate (motion allowed); shown = visible now.
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return; // stay visible

    setArmed(true);
    setShown(false);

    const el = ref.current;
    if (!el) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${armed && shown ? "reveal" : ""} ${
        armed && !shown ? "opacity-0" : ""
      }`}
      style={armed && shown ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
