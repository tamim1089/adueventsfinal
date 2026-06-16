"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Minimal, on-brand first paint: the ADU mark on warm paper with a thin
// determinate hairline bar. No starfield / particles. Resolves in < 1s.
export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setProgress(100));
    const t1 = setTimeout(() => setFading(true), 800);
    const t2 = setTimeout(() => setVisible(false), 1200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        transition: "opacity 0.4s var(--ease)",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <Image
        src="/brand/adu-logo.png"
        alt="Abu Dhabi University"
        width={187}
        height={140}
        priority
        style={{ height: 140, width: "auto", objectFit: "contain" }}
      />
      <div
        style={{
          width: 160,
          height: 2,
          borderRadius: 9999,
          background: "var(--glass-border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "var(--accent)",
            transition: "width 0.7s var(--ease)",
          }}
        />
      </div>
    </div>
  );
}
