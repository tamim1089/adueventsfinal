"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Calm, eased wheel/touch scrolling for the whole site. Disabled under
// prefers-reduced-motion. A low lerp = smooth, unhurried.
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.075,           // lower = smoother / calmer
      wheelMultiplier: 0.9,  // gentler wheel
      smoothWheel: true,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
