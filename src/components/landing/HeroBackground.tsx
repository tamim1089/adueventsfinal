"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ShaderAnimation } from "@/components/ui/shader-animation";

// The hero is a deliberate DARK band on the light page (the shader needs black).
// WebGL shader by default; under Reduce Motion (or no WebGL) → a static dark
// gradient so we never animate against a user's stated preference.
// A cursor-follow spotlight highlights the waves around the pointer.
export default function HeroBackground() {
  const [animate, setAnimate] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);

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

  // Pointer-follow highlight. HeroBackground sits behind content, so we listen
  // on the window and project the pointer into this element's box.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const root = rootRef.current;
      const spot = spotRef.current;
      if (!root || !spot) return;
      const r = root.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) {
        spot.style.opacity = "0";
        return;
      }
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      spot.style.opacity = "1";
      spot.style.background = `radial-gradient(260px circle at ${x}px ${y}px, rgba(255,255,255,0.14), rgba(255,45,63,0.12) 35%, transparent 70%)`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={rootRef} className="absolute inset-0 -z-10 overflow-hidden bg-black">
      {/* campus photo — the base layer the shader waves play over */}
      <Image
        src="/media/unifront.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {animate ? (
        // 'screen' blend: the shader's black becomes transparent, so its
        // glowing waves add over the photo instead of hiding it. Kept at a
        // reduced opacity so the campus photo stays clearly visible beneath.
        <div
          className="absolute inset-0 opacity-60 [&>div]:!h-full"
          style={{ mixBlendMode: "screen" }}
        >
          <ShaderAnimation />
        </div>
      ) : (
        <div
          className="absolute inset-0 opacity-70"
          style={{
            mixBlendMode: "screen",
            background:
              "radial-gradient(120% 100% at 20% 0%, #1b2a6b 0%, #0a0c16 55%, #000 100%)",
          }}
        />
      )}
      {/* legibility scrim — text contrast never depends on the shader frame */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-[#0a0c16]" />
      {/* cursor-follow highlight (additive, brightens the waves near the pointer) */}
      <div
        ref={spotRef}
        className="absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{ mixBlendMode: "screen" }}
        aria-hidden="true"
      />
      {/* fade into the light page below */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[var(--bg-base)]" />
    </div>
  );
}
