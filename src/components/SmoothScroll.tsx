"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

// Calm, eased wheel/touch scrolling for public pages only.
// Disabled on /admin routes (they use native scroll) and under
// prefers-reduced-motion.
export default function SmoothScroll() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.15,
      wheelMultiplier: 1.0,
      smoothWheel: true,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // When any image on the page finishes loading, recalculate scroll height.
    // Without this, Lenis freezes at the bottom of content that was visible at
    // mount time — lazy-loaded images that arrive later expand the page but
    // Lenis doesn't know the new scrollHeight.
    function onImgLoad() {
      lenis.resize();
    }
    function attachImageListeners() {
      document.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
        if (!img.complete) img.addEventListener("load", onImgLoad, { once: true });
      });
    }
    attachImageListeners();

    // Also resize after full page load and on resize
    window.addEventListener("load", () => lenis.resize());
    window.addEventListener("resize", () => lenis.resize());

    // Re-attach whenever route changes settle (new images may appear)
    const mo = new MutationObserver(attachImageListeners);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      mo.disconnect();
      window.removeEventListener("load", () => lenis.resize());
      window.removeEventListener("resize", () => lenis.resize());
    };
  }, [isAdmin]);

  return null;
}
