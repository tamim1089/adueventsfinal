"use client";

import { useEffect, useState } from "react";
import { ShaderAnimation } from "@/components/ui/shader-animation";

// The hero is a deliberate DARK band on the light page (the shader needs black).
// WebGL shader by default; under Reduce Motion (or no WebGL) → a static dark
// gradient so we never animate against a user's stated preference.
export default function HeroBackground() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasWebGL = (() => {
      try {
        const c = document.createElement("canvas");
        return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
      } catch {
        return false;
      }
    })();
    setAnimate(!reduce && hasWebGL);
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-black">
      {animate ? (
        <div className="absolute inset-0 [&>div]:!h-full">
          <ShaderAnimation />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 100% at 20% 0%, #1b2a6b 0%, #0a0c16 55%, #000 100%)",
          }}
        />
      )}
      {/* legibility scrim — text contrast never depends on the shader frame */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-[#0a0c16]" />
      {/* fade into the light page below */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[var(--bg-base)]" />
    </div>
  );
}
